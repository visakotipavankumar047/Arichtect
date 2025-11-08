import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "motion/react";
import { statusAccentMap, workspaceStatusOptions } from "../hooks/useWorkspaceData";

const buildDraft = (project) => ({
  name: project?.name ?? "",
  status: project?.status ?? workspaceStatusOptions[0].value,
  progress: project?.progress ?? 0,
  dueDate: project?.dueDate ?? "",
  studioLead: project?.studioLead ?? "",
  team: project?.team ?? [],
});

const workloadIndicator = (member) => {
  if (!member?.capacity) return "balanced";
  const loadRatio = member.assignedCount / member.capacity;
  if (loadRatio >= 1) return "overloaded";
  if (loadRatio >= 0.75) return "high";
  if (loadRatio >= 0.45) return "balanced";
  return "light";
};

const StatusPill = ({ status }) => {
  const color = statusAccentMap[status] ?? "#94a3b8";
  return (
    <span className="status-pill" style={{ backgroundColor: `${color}22`, color }}>
      {status}
    </span>
  );
};

const StatsCard = ({ label, value, helper }) => (
  <div className="metric-card">
    <p>{label}</p>
    <strong>{value}</strong>
    {helper && <small className="subdued-text">{helper}</small>}
  </div>
);

function ProjectWorkspace({
  projects,
  tasks,
  teamMembers,
  updateProject,
  deleteProject,
  addTask,
  updateTaskStatus,
  deleteTask,
  setActiveProjectId,
  stats,
}) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useMemo(() => projects.find((item) => item.id === projectId), [projects, projectId]);

  const [projectDraft, setProjectDraft] = useState(buildDraft(project));
  const [taskForm, setTaskForm] = useState({ name: "", assigneeId: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isTaskSaving, setIsTaskSaving] = useState(false);

  useEffect(() => {
    setActiveProjectId(projectId ?? null);
    return () => setActiveProjectId(null);
  }, [projectId, setActiveProjectId]);

  useEffect(() => {
    if (project) {
      setProjectDraft(buildDraft(project));
    }
  }, [project?.id, project?.name, project?.status, project?.progress, project?.dueDate, project?.studioLead, project]);

  const memberLookup = useMemo(() => {
    return teamMembers.reduce((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
  }, [teamMembers]);

  const projectTasks = useMemo(() => tasks.filter((task) => task.projectId === projectId), [tasks, projectId]);

  const isDirty = useMemo(() => {
    if (!project) return false;
    return (
      projectDraft.name !== project.name ||
      projectDraft.status !== project.status ||
      projectDraft.progress !== project.progress ||
      (projectDraft.dueDate || "") !== (project.dueDate || "") ||
      (projectDraft.studioLead || "") !== (project.studioLead || "") ||
      JSON.stringify(projectDraft.team) !== JSON.stringify(project.team)
    );
  }, [project, projectDraft]);

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setProjectDraft((prev) => ({
      ...prev,
      [name]: name === "progress" ? Number(value) : value,
    }));
  };

  const handleProjectSave = async (event) => {
    event.preventDefault();
    if (!project || !isDirty) return;
    setIsSaving(true);
    try {
      await updateProject(project.id, {
        name: projectDraft.name.trim() || "Untitled Project",
        status: projectDraft.status,
        progress: projectDraft.progress,
        dueDate: projectDraft.dueDate,
        studioLead: projectDraft.studioLead,
        team: projectDraft.team,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    const confirmed = window.confirm(`Delete ${project.name}? This cannot be undone.`);
    if (!confirmed) return;
    await deleteProject(project.id);
    navigate("/");
  };

  const handleTaskFormChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTask = async (event) => {
    event.preventDefault();
    if (!project || !taskForm.name.trim()) return;
    setIsTaskSaving(true);
    try {
      await addTask({ projectId: project.id, name: taskForm.name, assigneeId: taskForm.assigneeId || undefined });
      setTaskForm({ name: "", assigneeId: "" });
    } finally {
      setIsTaskSaving(false);
    }
  };

  const heroStatus = projectDraft.status;
  const heroProgress = projectDraft.progress;

  if (!project) {
    return (
      <section className="editor-page">
        <div className="empty-state large">
          <p>We could not find that project.</p>
          <Link to="/" className="primary-button">
            Return to dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="editor-page">
      <div className="editor-header">
        <div className="breadcrumb">
          <Link to="/">Dashboard</Link>
          <span>/</span>
          <span>{project.name}</span>
        </div>
        <div className="editor-actions">
          <button type="button" className="ghost-button" onClick={() => navigate(-1)}>
            Back
          </button>
          <button type="button" className="ghost-danger" onClick={handleDeleteProject}>
            Delete project
          </button>
        </div>
      </div>

      <div className="editor-hero">
        <div>
          <p className="eyebrow">Project</p>
          <h1>{projectDraft.name}</h1>
          <div className="editor-meta">
            <StatusPill status={heroStatus} />
            <span>{projectDraft.dueDate ? `Due ${projectDraft.dueDate}` : "Schedule TBD"}</span>
            <span>Lead {projectDraft.studioLead || "Unassigned"}</span>
          </div>
        </div>
        <div className="hero-progress">
          <p>Progress</p>
          <div className="progress-bar large">
            <span style={{ width: `${heroProgress}%` }} />
          </div>
          <strong>{heroProgress}%</strong>
        </div>
      </div>

      <section className="studio-metrics compact">
        <StatsCard label="Projects" value={stats.totalProjects} helper="in portfolio" />
        <StatsCard label="Shipped tasks" value={stats.completedTasks} helper={`of ${stats.totalTasks}`} />
        <StatsCard label="Average progress" value={`${stats.averageProgress}%`} helper="across all projects" />
        <StatsCard label="Ready teammates" value={stats.readyMembers} helper="available capacity" />
      </section>

      <div className="editor-grid">
        <form className="editor-card" onSubmit={handleProjectSave}>
          <div className="card-header">
            <div>
              <p className="eyebrow">Details</p>
              <h2>Project settings</h2>
            </div>
            <button type="submit" className="primary-button" disabled={!isDirty || isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>

          <div className="form-grid">
            <label>
              <span>Name</span>
              <input type="text" name="name" value={projectDraft.name} onChange={handleDraftChange} required />
            </label>
            <label>
              <span>Studio lead</span>
              <select name="studioLead" value={projectDraft.studioLead} onChange={handleDraftChange}>
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Team</span>
              <select
                multiple
                name="team"
                value={projectDraft.team}
                onChange={(e) =>
                  setProjectDraft((prev) => ({
                    ...prev,
                    team: Array.from(e.target.selectedOptions, (option) => option.value),
                  }))
                }
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              <span>Status</span>
              <select name="status" value={projectDraft.status} onChange={handleDraftChange}>
                {workspaceStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Due date</span>
              <input type="date" name="dueDate" value={projectDraft.dueDate} onChange={handleDraftChange} />
            </label>
          </div>

          <label className="range-label">
            <span>Progress</span>
            <div className="range-wrapper">
              <input
                type="range"
                name="progress"
                min="0"
                max="100"
                value={projectDraft.progress}
                onChange={handleDraftChange}
              />
              <span>{projectDraft.progress}%</span>
            </div>
          </label>
        </form>

        <div className="editor-card tasks-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Tasks</p>
              <h2>{projectTasks.length} items</h2>
            </div>
          </div>

          <form className="task-form" onSubmit={handleAddTask}>
            <input
              type="text"
              name="name"
              placeholder="Add task"
              value={taskForm.name}
              onChange={handleTaskFormChange}
              required
            />
            <select name="assigneeId" value={taskForm.assigneeId} onChange={handleTaskFormChange}>
              <option value="">Assign</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <button type="submit" className="primary-button" disabled={isTaskSaving}>
              {isTaskSaving ? "Adding..." : "Add"}
            </button>
          </form>

          <ul className="task-list">
            <AnimatePresence initial={false}>
              {projectTasks.map((task) => (
                <Motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`task-item ${task.status === "Done" ? "completed" : ""}`}
                >
                  <div className="task-status">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className={task.status === "Assigned" ? "assigned" : ""}
                    >
                      <option value="To Do">To Do</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div className="task-content">
                    <p>{task.name}</p>
                    {task.assigneeId && <div className="task-assignee">{memberLookup[task.assigneeId]?.name}</div>}
                  </div>
                  <button type="button" className="ghost-icon" onClick={() => deleteTask(task.id)}>
                    &times;
                  </button>
                </Motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>

      <section className="panel team-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Team</p>
            <h2>Capacity overview</h2>
          </div>
          <span className="panel-count">{teamMembers.length} people</span>
        </div>

        <div className="team-list">
          {teamMembers.map((member) => {
            const loadClass = workloadIndicator(member);
            const capacityPercent = member.capacity ? Math.min(100, (member.assignedCount / member.capacity) * 100) : 0;
            return (
              <Motion.div
                key={member.id}
                layout
                className={`team-card ${loadClass}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="team-card-header">
                  <div>
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                  </div>
                  <span>
                    {member.assignedCount}/{member.capacity}
                  </span>
                </div>
                <div className="capacity-bar">
                  <span style={{ width: `${capacityPercent}%` }} />
                </div>
              </Motion.div>
            );
          })}
        </div>
      </section>
    </section>
  );
}

export default ProjectWorkspace;

