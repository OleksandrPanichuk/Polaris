import {StateEffect, StateField} from "@codemirror/state";
import {Decoration, DecorationSet, EditorView, keymap, ViewPlugin, ViewUpdate, WidgetType,} from "@codemirror/view";
import {fetcher} from "@/features/editor/extensions/suggestion/fetcher";

let debounceTimer: number | null = null;
let isWaitingForSuggestion = false;
const DEBOUNCE_DELAY = 300;
let currentAbortController: AbortController | null = null;

// Rate limiting for Gemini API (6 suggestions per minute)
const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
let suggestionTimestamps: number[] = [];

// Suggestion State

const setSuggestionEffect = StateEffect.define<string | null>();

const suggestionState = StateField.define<string | null>({
  create: () => null,
  update: (value, transaction) => {
    for (const effect of transaction.effects) {
      if (effect.is(setSuggestionEffect)) {
        return effect.value;
      }
    }

    return value;
  },
});

//  Suggestion Render

class SuggestionWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.textContent = this.text;
    span.style.opacity = "0.4";
    span.style.pointerEvents = "none";
    return span;
  }
}

const renderPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }

    update(update: ViewUpdate) {
      const suggestionChanged = update.transactions.some((transaction) => {
        return transaction.effects.some((effect) =>
          effect.is(setSuggestionEffect),
        );
      });

      const shouldRebuild =
        update.docChanged || update.selectionSet || suggestionChanged;

      if (shouldRebuild) {
        this.decorations = this.build(update.view);
      }
    }

    build(view: EditorView) {
      if (isWaitingForSuggestion) {
        return Decoration.none;
      }

      const suggestion = view.state.field(suggestionState);

      if (!suggestion) {
        return Decoration.none;
      }

      const cursor = view.state.selection.main.head;

      return Decoration.set([
        Decoration.widget({
          widget: new SuggestionWidget(suggestion),
          side: 1,
        }).range(cursor),
      ]);
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

//  Keymap

const acceptSuggestionKeymap = keymap.of([
  {
    key: "Tab",
    run: (view) => {
      const suggestion = view.state.field(suggestionState);

      if (!suggestion) {
        return false;
      }

      const cursor = view.state.selection.main.head;

      view.dispatch({
        changes: { from: cursor, insert: suggestion },
        selection: { anchor: cursor + suggestion.length },
        effects: setSuggestionEffect.of(null),
      });

      return true;
    },
  },
]);

// Suggestion generation

const isRateLimitExceeded = (): boolean => {
  const now = Date.now();
  suggestionTimestamps = suggestionTimestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW,
  );
  return suggestionTimestamps.length >= RATE_LIMIT_MAX;
};

const recordSuggestionRequest = (): void => {
  suggestionTimestamps.push(Date.now());
};

const generatePayload = (view: EditorView, fileName: string) => {
  const code = view.state.doc.toString();

  if (!code || code.trim().length === 0) return null;

  const cursorPosition = view.state.selection.main.head;
  const currentLine = view.state.doc.lineAt(cursorPosition);
  const cursorInLine = cursorPosition - currentLine.from;

  const previousLines: string[] = [];
  const previousLinesToFetch = Math.min(5, currentLine.number - 1);
  for (let i = previousLinesToFetch; i >= 1; i--) {
    previousLines.push(view.state.doc.line(currentLine.number - i).text);
  }

  const nextLines: string[] = [];
  const totalLines = view.state.doc.lines;
  const linesToFetch = Math.min(5, totalLines - currentLine.number);
  for (let i = 1; i <= linesToFetch; i++) {
    nextLines.push(view.state.doc.line(currentLine.number + i).text);
  }

  return {
    fileName,
    code,
    currentLine: currentLine.text,
    previousLines: previousLines.join("\n"),
    textBeforeCursor: currentLine.text.slice(0, cursorInLine),
    textAfterCursor: currentLine.text.slice(cursorInLine),
    nextLines: nextLines.join("\n"),
    lineNumber: currentLine.number,
  };
};

const createDebouncedPlugin = (fileName: string) => {
  return ViewPlugin.fromClass(
    class {
      constructor(view: EditorView) {
        this.triggerSuggestion(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet) {
          this.triggerSuggestion(update.view);
        }
      }

      triggerSuggestion(view: EditorView) {
        if (debounceTimer !== null) {
          clearTimeout(debounceTimer);
        }

        if (currentAbortController !== null) {
          currentAbortController.abort();
        }

        // Check rate limit before setting waiting state
        if (isRateLimitExceeded()) {
          // Don't trigger suggestion if rate limit exceeded
          view.dispatch({ effects: setSuggestionEffect.of(null) });
          return;
        }

        isWaitingForSuggestion = true;

        debounceTimer = window.setTimeout(async () => {
          // Double-check rate limit right before making the request
          if (isRateLimitExceeded()) {
            isWaitingForSuggestion = false;
            view.dispatch({ effects: setSuggestionEffect.of(null) });
            return;
          }

          const payload = generatePayload(view, fileName);
          if (!payload) {
            isWaitingForSuggestion = false;
            view.dispatch({ effects: setSuggestionEffect.of(null) });
            return;
          }

          // Record this suggestion request
          recordSuggestionRequest();

          currentAbortController = new AbortController();
          const suggestion = await fetcher(
            payload,
            currentAbortController.signal,
          );

          isWaitingForSuggestion = false;
          view.dispatch({ effects: setSuggestionEffect.of(suggestion) });
        }, DEBOUNCE_DELAY);
      }

      destroy() {
        if (debounceTimer !== null) {
          clearTimeout(debounceTimer);
        }
        if (currentAbortController !== null) {
          currentAbortController.abort();
        }
      }
    },
  );
};

export const suggestion = (fileName: string) => [
  suggestionState,
  createDebouncedPlugin(fileName),
  renderPlugin,
  acceptSuggestionKeymap,
];
