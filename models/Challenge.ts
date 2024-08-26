import mongoose, { Schema } from "mongoose";

const ChallengeSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  participants: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      proofOfCompletion: { type: String }, // file
      completedAt: { type: Date },
      reported: {
        count: { type: Number, default: 0 },
        users: [
          { user: { type: Schema.Types.ObjectId, ref: "User" }, _id: false },
        ],
      },
      _id: false,
    },
  ],
});

export default mongoose.model("Challenge", ChallengeSchema);
