import mongoose, { Schema } from "mongoose";

//ONLY ADMIN CAN INSERT BADGES
const BadgeSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }, // e.g., picture
  criteria: { type: String, required: true }, // e.g., "Complete 30 daily habits"
  createdAt: { type: Date, default: Date.now, required: true },
});

export default mongoose.model("Badge", BadgeSchema);
