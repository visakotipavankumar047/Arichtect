import { useMemo } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "motion/react";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import Team from "./pages/Team";
import { useWorkspaceData } from "./hooks/useWorkspaceData";

const Loader = () => (
  <div className="workspace-loader">
    <span className="spinner" />
    <p>Calibrating workspace...</p>
  </div>
);

const PageTransition = ({ children, pathname }) => (
  <AnimatePresence mode="wait" initial={false}>
    <Motion.div
      key={pathname}
      className="page-transition"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </Motion.div>
  </AnimatePresence>
);

const WorkspaceRoutes = ({ workspace, stats, location }) => {
  return (
    <PageTransition pathname={location.pathname}>
      <Routes location={location}>
        <Route
          path="/"
          element={
            <Dashboard
              projects={workspace.projects}
              isLoading={workspace.isLoading}
              addProject={workspace.addProject}
              refreshWorkspace={workspace.refreshWorkspace}
            />
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProjectWorkspace
              projects={workspace.projects}
              tasks={workspace.tasks}
              teamMembers={workspace.teamMembers}
              updateProject={workspace.updateProject}
              deleteProject={workspace.deleteProject}
              addTask={workspace.addTask}
              updateTaskStatus={workspace.updateTaskStatus}
              deleteTask={workspace.deleteTask}
              setActiveProjectId={workspace.setActiveProjectId}
              stats={stats}
            />
          }
        />
        <Route
          path="/team"
          element={<Team teamMembers={workspace.teamMembers} addTeamMember={workspace.addTeamMember} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  );
};

const AppShell = () => {
  const workspace = useWorkspaceData();
  const location = useLocation();

  const stats = useMemo(() => {
    const totalProjects = workspace.projects.length;
    const totalTasks = workspace.tasks.length;
    const completedTasks = workspace.tasks.filter((task) => task.completed).length;
    const averageProgress = totalProjects
      ? Math.round(
          workspace.projects.reduce((sum, project) => sum + (typeof project.progress === "number" ? project.progress : 0), 0) /
            totalProjects,
        )
      : 0;
    const readyMembers = workspace.teamMembers.filter((member) => {
      if (!member.capacity) return true;
      const ratio = member.assignedCount / member.capacity;
      return ratio < 0.45;
    }).length;

    return { totalProjects, totalTasks, completedTasks, averageProgress, readyMembers };
  }, [workspace.projects, workspace.tasks, workspace.teamMembers]);

  return (
    <div className="app-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">VNZX Studio</p>
          <h1>Workspace control</h1>
        </div>
        <div className="header-actions">
          {workspace.isDemoMode && <span className="mode-pill">Demo data</span>}
          <nav className="workspace-nav">
            <Link to="/" className="nav-link">
              Dashboard
            </Link>
            <Link to="/team" className="nav-link">
              Team
            </Link>
          </nav>
          <button type="button" className="ghost-button" onClick={workspace.refreshWorkspace} disabled={workspace.isLoading}>
            Sync data
          </button>
        </div>
      </header>

      {workspace.error && (
        <div className="inline-alert">
          <span>{workspace.error}</span>
          <button type="button" className="ghost-button" onClick={workspace.refreshWorkspace}>
            Retry
          </button>
        </div>
      )}

      <main className="app-main">
        {workspace.isLoading ? <Loader /> : <WorkspaceRoutes workspace={workspace} stats={stats} location={location} />}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
