import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { useProjectStore } from "../store/useProjectStore";

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === id)
  );

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Dashboard
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {project.title}
        </h1>
        {project.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Project detail coming soon
          </p>
          <p className="text-xs text-muted-foreground">
            This workspace will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
