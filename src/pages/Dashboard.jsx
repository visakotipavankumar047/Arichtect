import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "motion/react";
import { statusAccentMap, workspaceStatusOptions } from "../hooks/useWorkspaceData";

const buildInitialProjectForm = () => ({
  name: "",
  status: workspaceStatusOptions[0].value,
  progress: 25,
  dueDate: "",
  studioLead: "",
});

const StatusPill = ({ status }) => {
  const color = statusAccentMap[status] ?? "#94a3b8";
  return (
    <span className="status-pill" style={{ backgroundColor: `${color}22`, color }}>
      {status}
    </span>
  );
};

function Dashboard({ projects, isLoading, addProject, refreshWorkspace }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(buildInitialProjectForm);
  const [isSaving, setIsSaving] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesFilter = statusFilter === "all" || project.status === statusFilter;
      const matchesQuery = project.name.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [projects, query, statusFilter]);

  const handleProjectFormChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((prev) => ({
      ...prev,
      [name]: name === "progress" ? Number(value) : value,
    }));
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const created = await addProject(projectForm);
      setProjectForm(buildInitialProjectForm());
      setIsCreateOpen(false);
      if (created?.id) {
        navigate(`/projects/${created.id}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const closeCreateSheet = () => {
    setIsCreateOpen(false);
    setProjectForm(buildInitialProjectForm());
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Project dashboard</h1>
          <p className="subdued-text">A focused view of every project in flight.</p>
        </div>
        <div className="dashboard-actions">
          <button type="button" className="ghost-button" onClick={refreshWorkspace} disabled={isLoading}>
            Refresh
          </button>
          <button type="button" className="primary-button" onClick={() => setIsCreateOpen(true)}>
            New project
          </button>
        </div>
      </div>

      <div className="project-board">
        <div className="project-board-toolbar">
          <div className="project-search">
            <input
              type="search"
              placeholder="Search projects"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="status-chip-group">
            <button
              type="button"
              className={`status-chip ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All statuses
            </button>
            {workspaceStatusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`status-chip ${statusFilter === option.value ? "active" : ""}`}
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="project-table">
          <AnimatePresence initial={false}>
            {filteredProjects.map((project) => (
              <Motion.article
                key={project.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="project-row"
              >
                <div className="project-row-main">
                  <h3>{project.name}</h3>
                  <p>
                    Lead: <strong>{project.studioLead || "Unassigned"}</strong>
                  </p>
                  <p className="subdued-text">Due {project.dueDate || "TBD"}</p>
                </div>
                <div className="project-row-status">
                  <StatusPill status={project.status} />
                  <div className="project-row-progress">
                    <div className="progress-bar">
                      <span style={{ width: `${project.progress}%` }} />
                    </div>
                    <span>{project.progress}%</span>
                  </div>
                </div>
                <div className="project-row-actions">
                  <Link className="ghost-button" to={`/projects/${project.id}`}>
                    Edit
                  </Link>
                </div>
              </Motion.article>
            ))}
          </AnimatePresence>

          {!filteredProjects.length && !isLoading && (
            <div className="empty-state compact">
              <p>No projects match this view.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isCreateOpen && (
          <Motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Motion.form
              className="project-sheet"
              onSubmit={handleCreateProject}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
            >
              <div className="sheet-header">
                <div>
                  <p className="eyebrow">Create</p>
                  <h2>New project</h2>
                </div>
                <button type="button" className="ghost-icon" onClick={closeCreateSheet}>
                  &times;
                </button>
              </div>

              <div className="form-grid">
                <label>
                  <span>Project name</span>
                  <input
                    type="text"
                    name="name"
                    value={projectForm.name}
                    onChange={handleProjectFormChange}
                    placeholder="Untitled concept"
                    required
                  />
                </label>
                <label>
                  <span>Status</span>
                  <select name="status" value={projectForm.status} onChange={handleProjectFormChange}>
                    {workspaceStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-grid">
                <label>
                  <span>Studio lead</span>
                  <input
                    type="text"
                    name="studioLead"
                    value={projectForm.studioLead}
                    onChange={handleProjectFormChange}
                    placeholder="Assign a lead"
                  />
                </label>
                <label>
                  <span>Due date</span>
                  <input type="date" name="dueDate" value={projectForm.dueDate} onChange={handleProjectFormChange} />
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
                    value={projectForm.progress}
                    onChange={handleProjectFormChange}
                  />
                  <span>{projectForm.progress}%</span>
                </div>
              </label>

              <div className="sheet-actions">
                <button type="button" className="ghost-button" onClick={closeCreateSheet}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? "Creating..." : "Create project"}
                </button>
              </div>
            </Motion.form>
          </Motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default Dashboard;
