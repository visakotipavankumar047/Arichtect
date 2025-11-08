import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import TeamMember from "../models/TeamMember.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { syncProjectProgress } from "../services/progressService.js";

const normalizeProgress = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
};

const asObjectId = (value) => {
  if (!value) {
    return null;
  }
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
};

export const applyWorkspaceRoutes = (app) => {
  app.get(
    "/api/workspace",
    asyncHandler(async (_req, res) => {
      const [projects, tasks, teamMembers] = await Promise.all([
        Project.find().sort({ createdAt: -1 }),
        Task.find().sort({ createdAt: -1 }),
        TeamMember.find().sort({ name: 1 }),
      ]);

      res.json({
        projects,
        tasks,
        teamMembers,
      });
    }),
  );

  app.post(
    "/api/projects",
    asyncHandler(async (req, res) => {
      const payload = {
        name: req.body.name?.trim() || "Untitled Project",
        status: req.body.status || "Planning",
        progress: normalizeProgress(req.body.progress) ?? 0,
        dueDate: req.body.dueDate ?? "",
        studioLead: req.body.studioLead ?? "",
        team: req.body.team?.map(asObjectId).filter(Boolean) ?? [],
      };

      const project = await Project.create(payload);
      res.status(201).json({ project: project.toJSON() });
    }),
  );

  app.patch(
    "/api/projects/:projectId",
    asyncHandler(async (req, res) => {
      const { projectId } = req.params;

      const updates = {};
      if (typeof req.body.name !== "undefined") updates.name = req.body.name?.trim() || "Untitled Project";
      if (typeof req.body.status !== "undefined") updates.status = req.body.status;
      if (typeof req.body.dueDate !== "undefined") updates.dueDate = req.body.dueDate ?? "";
      if (typeof req.body.studioLead !== "undefined") updates.studioLead = req.body.studioLead ?? "";
      if (typeof req.body.team !== "undefined") {
        updates.team = req.body.team?.map(asObjectId).filter(Boolean) ?? [];
      }
      if (typeof req.body.progress !== "undefined") {
        const progress = normalizeProgress(req.body.progress);
        if (typeof progress !== "undefined") {
          updates.progress = progress;
        }
      }

      const project = await Project.findByIdAndUpdate(projectId, updates, { new: true });

      if (!project) {
        res.status(404).json({ message: "Project not found." });
        return;
      }

      res.json({ project: project.toJSON() });
    }),
  );

  app.delete(
    "/api/projects/:projectId",
    asyncHandler(async (req, res) => {
      const { projectId } = req.params;

      await Task.deleteMany({ projectId });
      const project = await Project.findByIdAndDelete(projectId);

      if (!project) {
        res.status(404).json({ message: "Project not found." });
        return;
      }

      res.json({ projectId });
    }),
  );

  app.post(
    "/api/tasks",
    asyncHandler(async (req, res) => {
      const { projectId, name, assigneeId } = req.body;
      if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({ message: "A valid projectId is required." });
        return;
      }

      const payload = {
        projectId,
        name: name?.trim() || "Untitled Task",
        assigneeId: asObjectId(assigneeId),
      };

      const task = await Task.create(payload);
      const project = await syncProjectProgress(projectId);

      res.status(201).json({
        task: task.toJSON(),
        project,
      });
    }),
  );

  app.patch(
    "/api/tasks/:taskId",
    asyncHandler(async (req, res) => {
      const { taskId } = req.params;

      const updates = {};
      if (typeof req.body.name !== "undefined") updates.name = req.body.name?.trim() || "Untitled Task";
      if (typeof req.body.status !== "undefined") updates.status = req.body.status;
      if (typeof req.body.assigneeId !== "undefined") {
        updates.assigneeId = asObjectId(req.body.assigneeId);
      }

      const task = await Task.findByIdAndUpdate(taskId, updates, { new: true });
      if (!task) {
        res.status(404).json({ message: "Task not found." });
        return;
      }

      const project = await syncProjectProgress(task.projectId);

      res.json({
        task: task.toJSON(),
        project,
      });
    }),
  );

  app.delete(
    "/api/tasks/:taskId",
    asyncHandler(async (req, res) => {
      const { taskId } = req.params;
      const task = await Task.findByIdAndDelete(taskId);

      if (!task) {
        res.status(404).json({ message: "Task not found." });
        return;
      }

      const project = await syncProjectProgress(task.projectId);
      res.json({ taskId, project });
    }),
  );

  app.get(
    "/api/team",
    asyncHandler(async (_req, res) => {
      const members = await TeamMember.find().sort({ name: 1 });
      res.json({ teamMembers: members });
    }),
  );

  app.post(
    "/api/team",
    asyncHandler(async (req, res) => {
      const { name, role } = req.body;
      const member = await TeamMember.create({
        name: name?.trim() || "Unnamed",
        role: role?.trim() || "",
      });
      res.status(201).json({ member });
    }),
  );
};

