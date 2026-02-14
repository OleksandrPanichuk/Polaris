import type {Id} from "@convex/dataModel";
import {ProjectIdView} from "@/features/projects";

interface IProjectIdPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

const ProjectIdPage = async ({ params }: IProjectIdPageProps) => {
  const { projectId } = await params;
  return <ProjectIdView projectId={projectId as Id<"projects">} />;
};

export default ProjectIdPage;
