import mongoose, { Schema } from "mongoose";

const HabitSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  frequency: {
    type: String,
    required: true,
    enum: ["daily", "weekly"],
  }, // User can choose daily / weekly
  createdAt: { type: Date, default: Date.now, required: true },
  isPublic: { type: Boolean, default: false }, // public or private -> public will show on profile
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  daysCompleted: [
    //CHECKIN
    {
      date: { type: String, required: true }, // Date when the habit was completed
      _id: false,
    },
  ],
});

export default mongoose.model("Habit", HabitSchema);
