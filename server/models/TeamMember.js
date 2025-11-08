import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: "",
      trim: true,
    },
    capacity: {
      type: Number,
      default: 4,
      min: 1,
    },
  },
  { timestamps: true },
);

teamMemberSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const TeamMember = mongoose.model("TeamMember", teamMemberSchema);

export default TeamMember;
