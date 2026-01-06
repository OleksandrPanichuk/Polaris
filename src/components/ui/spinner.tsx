import {Loader2Icon} from "lucide-react";
import type {ComponentProps} from "react";
import {cn} from "@/lib/utils";

function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: <svg> is used for icon representation
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
