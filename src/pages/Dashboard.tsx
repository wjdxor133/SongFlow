import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Music2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { CreateProjectDialog } from "../components/projects/CreateProjectDialog";
import { useProjectStore } from "../store/useProjectStore";
import type { ProjectStatus, SongProject } from "../lib/types";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  idea: "Idea",
  reference: "Reference",
  prompting: "Prompting",
  suno_testing: "Suno Testing",
  refining: "Refining",
  selected: "Selected",
  archived: "Archived",
};

const STATUS_CLASS: Record<ProjectStatus, string> = {
  idea: "bg-muted text-muted-foreground",
  reference: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  prompting:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  suno_testing:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  refining:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  selected:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-muted text-muted-foreground opacity-60",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function ProjectCard({
  project,
  onDelete,
}: {
  project: SongProject;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
      onDelete(project.id);
    }
  }

  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-accent/50"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-semibold leading-tight">
          {project.title}
        </h3>
        <button
          className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          onClick={handleDelete}
          title="Delete project"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {project.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {project.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[project.status]}`}
          >
            {STATUS_LABEL[project.status]}
          </span>
          {project.genre && (
            <span className="truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {project.genre}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDate(project.updatedAt)}
        </span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const projects = useProjectStore((s) => s.projects);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length === 0
              ? "Create your first project to get started."
              : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-muted p-3">
              <Music2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No projects yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click "New Project" to create your first song project.
              </p>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={deleteProject}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
