"use client";

import type {Id} from "@convex/dataModel";
import {AlertTriangleIcon} from "lucide-react";
import Image from "next/image";
import {useEffect, useRef} from "react";
import {CodeEditor, FileBreadcrumb, TopNavigation, useEditor} from "@/features/editor";
import {useFile, useUpdateFile} from "@/features/projects";

interface IEditorViewProps {
  projectId: Id<"projects">;
}

const DEBOUNCE_MS = 1500;

export const EditorView = ({ projectId }: IEditorViewProps) => {
  const { activeTabId } = useEditor(projectId);
  const activeFile = useFile(activeTabId);
  const updateFile = useUpdateFile();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActiveFileBinary = activeFile && activeFile.storageId;
  const isActiveFileText = activeFile && !activeFile.storageId;

  // biome-ignore lint/correctness/useExhaustiveDependencies: need to cleanup pending debounced updates on unmount of file change
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeTabId]);

  return (
    <div className={"h-full flex flex-col"}>
      <div className={"flex items-center"}>
        <TopNavigation projectId={projectId} />
      </div>
      {activeTabId && <FileBreadcrumb projectId={projectId} />}
      <div className={"flex-1 min-h-0 bg-background"}>
        {!activeFile && (
          <div className="size-full flex items-center justify-center">
            <Image
              src="/logo-alt.svg"
              alt="Polaris"
              width={50}
              height={50}
              className="opacity-25"
            />
          </div>
        )}
        {isActiveFileText && (
          <CodeEditor
            key={activeFile._id}
            fileName={activeFile.name}
            initialValue={activeFile.content}
            onChange={(content: string) => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }

              timeoutRef.current = setTimeout(() => {
                updateFile({ id: activeFile._id, content });
              }, DEBOUNCE_MS);
            }}
          />
        )}
        {isActiveFileBinary && (
          <div className="size-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2.5 max-w-md text-center">
              <AlertTriangleIcon className="size-10 text-yellow-500" />
              <p className="text-sm">
                The file is not displayed in the text editor because it is
                either binary or uses an unsupported text encoding.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
