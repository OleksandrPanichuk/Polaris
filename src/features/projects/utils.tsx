import type {Doc} from "@convex/dataModel";
import {formatDistanceToNow} from "date-fns";
import {AlertCircleIcon, GlobeIcon, Loader2Icon} from "lucide-react";
import {FaGithub} from "react-icons/fa";
import {cn} from "@/lib/utils";

export const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
  });
};

export const getProjectIcon = (
  project: Doc<"projects">,
  className?: string,
) => {
  if (project.importStatus === "completed") {
    return (
      <FaGithub className={cn("size-3.5 text-muted-foreground", className)} />
    );
  }

  if (project.importStatus === "failed") {
    return (
      <AlertCircleIcon
        className={cn("size-3.5 text-muted-foreground", className)}
      />
    );
  }

  if (project.importStatus === "importing") {
    return (
      <Loader2Icon
        className={cn("size-3.5 text-muted-foreground animate-spin", className)}
      />
    );
  }

  return (
    <GlobeIcon className={cn("size-3.5 text-muted-foreground", className)} />
  );
};
