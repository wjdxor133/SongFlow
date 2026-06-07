import { create } from "zustand";
import type {
  AgentRequest,
  AgentResponse,
  AgentProvider,
  GeneratedPrompt,
  ProjectNote,
  PromptRefinement,
  ResultFeedback,
  SongProject,
  SunoResult,
} from "../lib/types";
import { loadProjects, saveProjects } from "../lib/storage/localStorage";

type CreateProjectInput = {
  title: string;
  description: string;
  genre: string;
  moods: string[];
  targetVibe: string;
  agentProvider?: AgentProvider;
};

type ProjectStore = {
  projects: SongProject[];

  createProject: (input: CreateProjectInput) => SongProject;
  updateProject: (id: string, patch: Partial<SongProject>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => SongProject | undefined;

  addAgentRequest: (projectId: string, request: AgentRequest) => void;
  addAgentResponse: (projectId: string, response: AgentResponse) => void;
  addPrompt: (projectId: string, prompt: GeneratedPrompt) => void;
  addSunoResult: (projectId: string, result: SunoResult) => void;
  addFeedback: (projectId: string, feedback: ResultFeedback) => void;
  addRefinement: (projectId: string, refinement: PromptRefinement) => void;
  addNote: (projectId: string, note: ProjectNote) => void;
};

function patchProject(
  projects: SongProject[],
  id: string,
  updater: (p: SongProject) => SongProject
): SongProject[] {
  return projects.map((p) => (p.id === id ? updater(p) : p));
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: loadProjects(),

  createProject(input) {
    const now = new Date().toISOString();
    const project: SongProject = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      genre: input.genre,
      moods: input.moods,
      targetVibe: input.targetVibe,
      status: "idea",
      agentProvider: input.agentProvider ?? "manual",
      references: [],
      referenceAnalyses: [],
      chordProgressions: [],
      groovePatterns: [],
      prompts: [],
      sunoResults: [],
      feedbacks: [],
      refinements: [],
      agentRequests: [],
      agentResponses: [],
      notes: [],
      createdAt: now,
      updatedAt: now,
    };
    set((s) => {
      const next = [...s.projects, project];
      saveProjects(next);
      return { projects: next };
    });
    return project;
  },

  updateProject(id, patch) {
    set((s) => {
      const next = patchProject(s.projects, id, (p) => ({
        ...p,
        ...patch,
        updatedAt: new Date().toISOString(),
      }));
      saveProjects(next);
      return { projects: next };
    });
  },

  deleteProject(id) {
    set((s) => {
      const next = s.projects.filter((p) => p.id !== id);
      saveProjects(next);
      return { projects: next };
    });
  },

  getProjectById(id) {
    return get().projects.find((p) => p.id === id);
  },

  addAgentRequest(projectId, request) {
    set((s) => {
      const next = patchProject(s.projects, projectId, (p) => ({
        ...p,
        agentRequests: [...p.agentRequests, request],
        updatedAt: new Date().toISOString(),
      }));
      saveProjects(next);
      return { projects: next };
    });
  },

  addAgentResponse(projectId, response) {
    set((s) => {
      const next = patchProject(s.projects, projectId, (p) => ({
        ...p,
        agentResponses: [...p.agentResponses, response],
        updatedAt: new Date().toISOString(),
      }));
      saveProjects(next);
      return { projects: next };
    });
  },

  addPrompt(projectId, prompt) {
    set((s) => {
      const next = patchProject(s.projects, projectId, (p) => ({
        ...p,
        prompts: [...p.prompts, prompt],
        updatedAt: new Date().toISOString(),
      }));
      saveProjects(next);
      return { projects: next };
    });
  },

  addSunoResult(projectId, result) {
    set((s) => {
      const next = patchProject(s.projects, projectId, (p) => ({
        ...p,
        sunoResults: [...p.sunoResults, result],
        updatedAt: new Date().toISOString(),
      }));
      saveProjects(next);
      return { projects: next };
    });
  },

  addFeedback(projectId, feedback) {
    set((s) => {
      const next = patchProject(s.projects, projectId, (p) => ({
        ...p,
        feedbacks: [...p.feedbacks, feedback],
        updatedAt: new Date().toISOString(),
      }));
      saveProjects(next);
      return { projects: next };
    });
  },

  addRefinement(projectId, refinement) {
    set((s) => {
      const next = patchProject(s.projects, projectId, (p) => ({
        ...p,
        refinements: [...p.refinements, refinement],
        updatedAt: new Date().toISOString(),
      }));
      saveProjects(next);
      return { projects: next };
    });
  },

  addNote(projectId, note) {
    set((s) => {
      const next = patchProject(s.projects, projectId, (p) => ({
        ...p,
        notes: [...p.notes, note],
        updatedAt: new Date().toISOString(),
      }));
      saveProjects(next);
      return { projects: next };
    });
  },
}));
