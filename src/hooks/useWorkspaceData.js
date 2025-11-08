import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../../utils/apiClient";







export const workspaceStatusOptions = [
  { value: "Planning", label: "Planning", accent: "#fde047" },
  { value: "In Progress", label: "In Progress", accent: "#60a5fa" },
  { value: "On Hold", label: "On Hold", accent: "#f97316" },
  { value: "Completed", label: "Completed", accent: "#34d399" },
];

export const statusAccentMap = workspaceStatusOptions.reduce(
  (acc, status) => ({
    ...acc,
    [status.value]: status.accent,
  }),
  {},
);

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `tmp-${Math.random().toString(36).slice(2, 9)}`;
};

const normalizeProject = (row) => ({
  id: row.id ?? row._id,
  name: row.name ?? "Untitled Project",
  status: row.status ?? "Planning",
  progress: typeof row.progress === "number" ? row.progress : Number(row.progress ?? 0),
  dueDate: row.due_date ?? row.dueDate ?? "",
  studioLead: row.studio_lead ?? row.studioLead ?? "",
  team: row.team ?? [],
});

const normalizeTask = (row) => ({
  id: row.id ?? row._id,
  projectId: row.project_id ?? row.projectId,
  name: row.name ?? "Untitled Task",
  status: row.status ?? "To Do",
  assigneeId: row.assignee_id ?? row.assigneeId ?? null,
});

const normalizeMember = (row) => ({
  id: row.id ?? row._id,
  name: row.name ?? "Unnamed",
  role: row.role ?? "",
  capacity: row.capacity ?? row.max_capacity ?? 4,
});

const DATA_SOURCES = {
  LOADING: "loading",
  API: "api",
  DEMO: "demo",
};

export function useWorkspaceData() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(DATA_SOURCES.LOADING);

  const hydrateFromApi = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get("/workspace");
      const normalizedProjects = (data.projects ?? []).map(normalizeProject);
      const normalizedTasks = (data.tasks ?? []).map(normalizeTask);
      const normalizedMembers = (data.teamMembers ?? []).map(normalizeMember);

      setProjects(normalizedProjects);
      setTasks(normalizedTasks);
      setTeamMembers(normalizedMembers);
      setActiveProjectId(normalizedProjects[0]?.id ?? null);
      setDataSource(DATA_SOURCES.API);
    } catch (err) {
      console.error("Failed to load workspace API data:", err);
      setError("Unable to reach the workspace API. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateFromApi();
  }, [hydrateFromApi]);

  const isDemoMode = dataSource !== DATA_SOURCES.API;

  const autoUpdateProjectProgress = useCallback(
    async (projectId, nextTasks) => {
      if (dataSource !== DATA_SOURCES.DEMO) {
        return;
      }

      const relatedTasks = (nextTasks ?? tasks).filter((task) => task.projectId === projectId);
      if (!relatedTasks.length) {
        return;
      }

      const completedCount = relatedTasks.filter((task) => task.status === "Done").length;
      const computedProgress = Math.round((completedCount / relatedTasks.length) * 100);
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          const nextStatus = computedProgress === 100 ? "Completed" : project.status;
          if (project.progress === computedProgress && project.status === nextStatus) {
            return project;
          }

          return { ...project, progress: computedProgress, status: nextStatus };
        }),
      );
    },
    [dataSource, tasks],
  );

  const addProject = useCallback(
    async ({ name, status = "Planning", progress = 0, dueDate = "", studioLead = "", team = [] }) => {
      const project = {
        id: generateId(),
        name: name?.trim() || "Untitled Project",
        status,
        progress,
        dueDate,
        studioLead,
        team,
      };

      setProjects((prev) => [project, ...prev]);
      setActiveProjectId(project.id);

      if (dataSource !== DATA_SOURCES.API) {
        return project;
      }

      try {
        const { project: remoteProject } = await apiClient.post("/projects", {
          name: project.name,
          status: project.status,
          progress: project.progress,
          dueDate: project.dueDate,
          studioLead: project.studioLead,
          team: project.team,
        });

        if (remoteProject) {
          const normalized = normalizeProject(remoteProject);
          setProjects((prev) => prev.map((item) => (item.id === project.id ? normalized : item)));
          setActiveProjectId(normalized.id);
          return normalized;
        }
      } catch (insertErr) {
        console.error("Failed to persist project:", insertErr);
        setError("Unable to sync the new project with the workspace API. The record only lives in this session.");
        setDataSource(DATA_SOURCES.DEMO);
      }

      return project;
    },
    [dataSource],
  );

  const updateProject = useCallback(
    async (projectId, changes) => {
      setProjects((prev) =>
        prev.map((project) => (project.id === projectId ? { ...project, ...changes } : project)),
      );

      if (dataSource !== DATA_SOURCES.API) {
        return;
      }

      try {
        const { project } = await apiClient.patch(`/projects/${projectId}`, changes);
        if (project) {
          const normalized = normalizeProject(project);
          setProjects((prev) => prev.map((item) => (item.id === normalized.id ? normalized : item)));
        }
      } catch (updateErr) {
        console.error("Failed to update project:", updateErr);
        setError("Workspace API rejected the project update. The dashboard shows the optimistic value.");
      }
    },
    [dataSource],
  );

  const deleteProject = useCallback(
    async (projectId) => {
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setTasks((prev) => prev.filter((task) => task.projectId !== projectId));

      if (activeProjectId === projectId) {
        setActiveProjectId((prev) => (prev === projectId ? projects.find((p) => p.id !== projectId)?.id ?? null : prev));
      }

      if (dataSource !== DATA_SOURCES.API) {
        return;
      }

      try {
        await apiClient.delete(`/projects/${projectId}`);
      } catch (deleteErr) {
        console.error("Failed to delete project via API:", deleteErr);
        setError("Workspace API deletion failed; refreshed data may be required.");
        hydrateFromApi();
      }
    },
    [activeProjectId, dataSource, hydrateFromApi, projects],
  );

  const addTask = useCallback(
    async ({ projectId, name, assigneeId }) => {
      const task = {
        id: generateId(),
              name: name?.trim() || "Untitled Task",
              projectId,
              assigneeId: assigneeId || null,
              status: assigneeId ? "Assigned" : "To Do",
            };
      setTasks((prev) => [task, ...prev]);
      await autoUpdateProjectProgress(projectId, [task, ...tasks]);

      if (dataSource !== DATA_SOURCES.API) {
        return task;
      }

      try {
        const { task: remoteTask, project } = await apiClient.post("/tasks", {
          projectId,
          name: task.name,
          assigneeId: task.assigneeId ?? undefined,
        });

        if (remoteTask) {
          const normalizedTask = normalizeTask(remoteTask);
          setTasks((prev) => prev.map((item) => (item.id === task.id ? normalizedTask : item)));
        }

        if (project) {
          const normalizedProject = normalizeProject(project);
          setProjects((prev) => prev.map((item) => (item.id === normalizedProject.id ? normalizedProject : item)));
        }

        return remoteTask ?? task;
      } catch (taskErr) {
        console.error("Failed to persist task:", taskErr);
        setError("Unable to sync the new task with the workspace API.");
        setDataSource(DATA_SOURCES.DEMO);
      }

      return task;
    },
    [autoUpdateProjectProgress, dataSource, tasks],
  );

  const updateTaskStatus = useCallback(
    async (taskId, status) => {
      const currentTask = tasks.find((task) => task.id === taskId);
      if (!currentTask) {
        return;
      }

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );

      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      );
      await autoUpdateProjectProgress(currentTask.projectId, updatedTasks);

      if (dataSource !== DATA_SOURCES.API) {
        return;
      }

      try {
        const { task, project } = await apiClient.patch(`/tasks/${taskId}`, { status });

        if (task) {
          const normalizedTask = normalizeTask(task);
          setTasks((prev) => prev.map((item) => (item.id === normalizedTask.id ? normalizedTask : item)));
        }

        if (project) {
          const normalizedProject = normalizeProject(project);
          setProjects((prev) => prev.map((item) => (item.id === normalizedProject.id ? normalizedProject : item)));
        }
      } catch (toggleErr) {
        console.error("Failed to update task status:", toggleErr);
        setError("Workspace API could not save the task change.");
        hydrateFromApi();
      }
    },
    [autoUpdateProjectProgress, dataSource, hydrateFromApi, tasks],
  );

  const deleteTask = useCallback(
    async (taskId) => {
      const task = tasks.find((item) => item.id === taskId);
      setTasks((prev) => prev.filter((item) => item.id !== taskId));

      if (task) {
        await autoUpdateProjectProgress(task.projectId, tasks.filter((item) => item.id !== taskId));
      }

      if (dataSource !== DATA_SOURCES.API) {
        return;
      }

      try {
        const { project } = await apiClient.delete(`/tasks/${taskId}`);
        if (project) {
          const normalizedProject = normalizeProject(project);
          setProjects((prev) => prev.map((item) => (item.id === normalizedProject.id ? normalizedProject : item)));
        }
      } catch (deleteErr) {
        console.error("Failed to delete task:", deleteErr);
        setError("Workspace API rejected the task deletion.");
        hydrateFromApi();
      }
    },
    [autoUpdateProjectProgress, dataSource, hydrateFromApi, tasks],
  );

  const addTeamMember = useCallback(
    async ({ name, role }) => {
      const member = {
        id: generateId(),
        name: name?.trim() || "Unnamed",
        role: role?.trim() || "",
      };

      setTeamMembers((prev) => [...prev, member]);

      if (dataSource !== DATA_SOURCES.API) {
        return member;
      }

      try {
        const { member: remoteMember } = await apiClient.post("/team", {
          name: member.name,
          role: member.role,
        });

        if (remoteMember) {
          const normalized = normalizeMember(remoteMember);
          setTeamMembers((prev) => prev.map((item) => (item.id === member.id ? normalized : item)));
          return normalized;
        }
      } catch (insertErr) {
        console.error("Failed to persist team member:", insertErr);
        setError("Unable to sync the new team member with the workspace API.");
        setDataSource(DATA_SOURCES.DEMO);
      }

      return member;
    },
    [dataSource],
  );

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null,
    [projects, activeProjectId],
  );

  const tasksByProject = useMemo(() => {
    if (!activeProject) {
      return [];
    }
    return tasks.filter((task) => task.projectId === activeProject.id);
  }, [tasks, activeProject]);

  const teamWithLoad = useMemo(() => {
    return teamMembers.map((member) => {
      const assignedTasks = tasks.filter((task) => task.assigneeId === member.id);
      return {
        ...member,
        assignedCount: assignedTasks.length,
      };
    });
  }, [teamMembers, tasks]);

  return {
    projects,
    tasks,
    teamMembers: teamWithLoad,
    activeProject,
    tasksByProject,
    activeProjectId,
    isLoading,
    error,
    isDemoMode,
    setActiveProjectId,
    refreshWorkspace: hydrateFromApi,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTaskStatus,
    deleteTask,
    addTeamMember,
  };
}

