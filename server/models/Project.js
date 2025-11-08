import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      default: "Planning",
      enum: ["Planning", "In Progress", "On Hold", "Completed"],
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    dueDate: {
      type: String,
      default: "",
    },
    studioLead: {
      type: String,
      default: "",
    },
    team: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember",
      },
    ],
  },
  {
    timestamps: true,
  },
);

projectSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    if (ret.team) {
      ret.team = ret.team.map((t) => t.toString());
    }
    delete ret._id;
    return ret;
  },
});

const Project = mongoose.model("Project", projectSchema);

export default Project;
