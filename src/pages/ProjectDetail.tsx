import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { useProjectStore } from "../store/useProjectStore";
import { ManualAgentPanel } from "../components/agent/ManualAgentPanel";

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
    <div className="flex h-full flex-col gap-6 p-6 overflow-auto">
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
        <div className="mt-2 flex flex-wrap gap-2">
          {project.genre && (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {project.genre}
            </span>
          )}
          {project.moods.map((mood) => (
            <span
              key={mood}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs"
            >
              {mood}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">Manual Agent Mode</h2>
        <p className="text-xs text-muted-foreground">
          Provider: <span className="font-medium">{project.agentProvider}</span>
        </p>
      </div>

      <ManualAgentPanel project={project} />
    </div>
  );
}
