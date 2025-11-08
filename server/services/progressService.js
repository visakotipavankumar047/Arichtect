import Project from "../models/Project.js";
import Task from "../models/Task.js";

export const syncProjectProgress = async (projectId) => {
  if (!projectId) {
    return null;
  }

  const relatedTasks = await Task.find({ projectId }).lean();
  const totalTasks = relatedTasks.length;

  if (totalTasks === 0) {
    const project = await Project.findByIdAndUpdate(
      projectId,
      { progress: 0 },
      { new: true },
    );
    return project ? project.toJSON() : null;
  }

  const completedCount = relatedTasks.filter((task) => task.status === "Done").length;
  const nextProgress = Math.round((completedCount / totalTasks) * 100);

  const update = { progress: nextProgress };
  if (nextProgress === 100) {
    update.status = "Completed";
  }

  const project = await Project.findByIdAndUpdate(projectId, update, {
    new: true,
  });

  return project ? project.toJSON() : null;
};
