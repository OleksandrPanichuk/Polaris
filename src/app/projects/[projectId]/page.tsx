import { ProjectIdView } from "@/features/projects";
import type { Id } from "@convex/dataModel";

interface IProjectIdPageProps {
  params: Promise<{
    projectId: Id<"projects">;
  }>;
}

const ProjectIdPage = async ({ params }: IProjectIdPageProps) => {
  const { projectId } = await params;
  return <ProjectIdView projectId={projectId} />;
};

export default ProjectIdPage;
