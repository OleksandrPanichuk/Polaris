"use client";

import {SparkleIcon} from "lucide-react";
import {Poppins} from "next/font/google";
import {useEffect, useState} from "react";
import {FaGithub} from "react-icons/fa";
import {adjectives, animals, colors, uniqueNamesGenerator,} from "unique-names-generator";
import {Button, Kbd} from "@/components/ui";
import {ProjectsCommandDialog, ProjectsList, useCreateProject} from "@/features/projects";
import {cn} from "@/lib/utils";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const ProjectsView = () => {
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);

  const createProject = useCreateProject();

  const handleCreateProject = () => {
    const projectName = uniqueNamesGenerator({
      dictionaries: [adjectives, animals, colors],
      separator: "-",
      length: 3,
    });

    createProject({
      name: projectName,
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "k") {
          e.preventDefault();
          setCommandDialogOpen(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <ProjectsCommandDialog
        open={commandDialogOpen}
        onOpenChange={setCommandDialogOpen}
      />
      <div
        className={
          "min-h-screen bg-sidebar flex flex-col items-center justify-center p-6 md:p-16"
        }
      >
        <div
          className={"w-full max-w-sm mx-auto flex flex-col gap-4 items-center"}
        >
          <div className={"flex justify-between gap-4 w-full"}>
            <div className="flex items-center gap-2 w-full group/logo">
              <img
                src="/logo.svg"
                alt="Polaris"
                className="size-[32px] md:size-[46px]"
              />
              <h1
                className={cn(
                  "text-4xl md:text-5xl font-semibold",
                  font.className,
                )}
              >
                Polaris
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none"
                onClick={handleCreateProject}
              >
                <div className="flex items-center justify-between w-full">
                  <SparkleIcon className="size-4" />
                  <Kbd className="bg-accent border">⌘J</Kbd>
                </div>
                <div>
                  <span className="text-sm">New</span>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => {}}
                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <FaGithub className="size-4" />
                  <Kbd className="bg-accent border">⌘I</Kbd>
                </div>
                <div>
                  <span className="text-sm">Import</span>
                </div>
              </Button>
            </div>
            <ProjectsList onViewAll={() => setCommandDialogOpen(true)} />
          </div>
        </div>
      </div>
    </>
  );
};
