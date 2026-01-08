import type {Id} from "@convex/dataModel";
import {ProjectIdLayout} from "@/features/projects";

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: Id<"projects"> }>;
}) => {
  const { projectId } = await params;

  return <ProjectIdLayout projectId={projectId}>{children}</ProjectIdLayout>;
};

export default Layout;
