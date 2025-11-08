import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Done"],
      default: "To Do",
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    ret.projectId = ret.projectId?.toString();
    if (ret.assigneeId) {
      ret.assigneeId = ret.assigneeId.toString();
    }
    delete ret._id;
    return ret;
  },
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
