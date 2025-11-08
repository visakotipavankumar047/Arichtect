import Project from "../models/Project.js";
import Task from "../models/Task.js";
import TeamMember from "../models/TeamMember.js";
import { sampleProjects, sampleTasks, sampleTeamMembers } from "../data/seedData.js";

export const seedWorkspace = async () => {
  const [projectCount, taskCount, teamCount] = await Promise.all([
    Project.countDocuments(),
    Task.countDocuments(),
    TeamMember.countDocuments(),
  ]);

  if (teamCount === 0) {
    await TeamMember.insertMany(sampleTeamMembers);
  }

  if (projectCount === 0) {
    await Project.insertMany(sampleProjects);
  }

  if (taskCount === 0) {
    await Task.insertMany(sampleTasks);
  }
};
