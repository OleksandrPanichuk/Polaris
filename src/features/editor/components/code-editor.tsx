import {indentWithTab} from "@codemirror/commands";
import {oneDark} from "@codemirror/theme-one-dark";
import {EditorView, keymap} from "@codemirror/view";
import {indentationMarkers} from "@replit/codemirror-indentation-markers";
import {useEffect, useMemo, useRef} from "react";
import {customSetup, customTheme, getLanguageExtension, minimap} from "@/features/editor/extensions";

interface ICodeEditorProps {
  fileName: string;
  initialValue?: string;
  onChange: (value: string) => void;
}

export const CodeEditor = ({
  fileName,
  initialValue,
  onChange,
}: ICodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const languageExtension = useMemo(() => {
    return getLanguageExtension(fileName);
  }, [fileName]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: initialValue is only used for initial documennt
  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      doc: initialValue,
      parent: editorRef.current,
      extensions: [
        oneDark,
        customTheme,
        customSetup,
        languageExtension,
        keymap.of([indentWithTab]),
        minimap(),
        indentationMarkers(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [languageExtension]);
  return <div ref={editorRef} className="size-full pl-4 bg-background" />;
};
