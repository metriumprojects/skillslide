import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: String,
    public_id: String,
  },
  { _id: false }
);

const studentStorySchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    story: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: imageSchema,
      required: true,
    },
    profileImage: {
      type: imageSchema,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

studentStorySchema.index({ isActive: 1, order: 1 });

export default mongoose.model("StudentStory", studentStorySchema);
