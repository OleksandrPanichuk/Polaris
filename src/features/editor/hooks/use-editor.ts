import type {Id} from "@convex/dataModel";
import {useCallback} from "react";
import {useEditorStore} from "@/features/editor";

export const useEditor = (projectId: Id<"projects">) => {
  const store = useEditorStore();
  const tabState = useEditorStore((state) => state.getTabState(projectId));

  const openFile = useCallback(
    (fileId: Id<"files">, options: { pinned: boolean }) => {
      store.openFile(projectId, fileId, options);
    },
    [projectId, store.openFile],
  );

  const closeTab = useCallback(
    (fileId: Id<"files">) => {
      store.closeTab(projectId, fileId);
    },
    [store.closeTab, projectId],
  );

  const closeAllTabs = useCallback(() => {
    store.closeAllTabs(projectId);
  }, [store.closeAllTabs, projectId]);

  const setActiveTab = useCallback(
    (fileId: Id<"files">) => {
      store.setActiveTab(projectId, fileId);
    },
    [store.setActiveTab, projectId],
  );

  return {
    openTabs: tabState.openTabs,
    activeTabId: tabState.activeTabId,
    previewTabId: tabState.previewTabId,
    openFile,
    closeTab,
    closeAllTabs,
    setActiveTab,
  };
};
