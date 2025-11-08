import mongoose from "mongoose";

const projectIds = {
  studioRefresh: new mongoose.Types.ObjectId(),
  galleryExpansion: new mongoose.Types.ObjectId(),
  campusHousing: new mongoose.Types.ObjectId(),
};

const teamIds = {
  ava: new mongoose.Types.ObjectId(),
  ethan: new mongoose.Types.ObjectId(),
  sloane: new mongoose.Types.ObjectId(),
  jules: new mongoose.Types.ObjectId(),
};

export const sampleProjects = [
  {
    _id: projectIds.studioRefresh,
    name: "Atelier North Workspace Refresh",
    status: "In Progress",
    progress: 68,
    dueDate: "2025-03-14",
    studioLead: "Ava Martin",
  },
  {
    _id: projectIds.galleryExpansion,
    name: "Riverbank Gallery Expansion",
    status: "Planning",
    progress: 35,
    dueDate: "2025-05-02",
    studioLead: "Luca Garcia",
  },
  {
    _id: projectIds.campusHousing,
    name: "Redwood Campus Housing",
    status: "Completed",
    progress: 100,
    dueDate: "2024-11-20",
    studioLead: "Mara Chen",
  },
];

export const sampleTasks = [
  {
    projectId: projectIds.studioRefresh,
    name: "Site survey & zoning review",
    completed: true,
    assigneeId: teamIds.ava,
  },
  {
    projectId: projectIds.studioRefresh,
    name: "Finish palette + FF&E",
    completed: false,
    assigneeId: teamIds.ethan,
  },
  {
    projectId: projectIds.galleryExpansion,
    name: "Concept massing model",
    completed: false,
    assigneeId: teamIds.sloane,
  },
  {
    projectId: projectIds.campusHousing,
    name: "Permit close-out package",
    completed: true,
    assigneeId: teamIds.jules,
  },
];

export const sampleTeamMembers = [
  { _id: teamIds.ava, name: "Ava Martin", role: "Design Lead", capacity: 5 },
  { _id: teamIds.ethan, name: "Ethan Ward", role: "Project Architect", capacity: 4 },
  { _id: teamIds.sloane, name: "Sloane Ali", role: "Visualization", capacity: 3 },
  { _id: teamIds.jules, name: "Jules Ferreira", role: "Permitting", capacity: 2 },
];
