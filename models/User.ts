import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  fullname: { type: String, required: true }, /////////
  username: { type: String, required: true, unique: true }, /////////
  email: { type: String, required: true, unique: true }, /////////
  password: { type: String, required: true }, /////////
  profilePicture: { type: String, default: "default.png" }, /////////
  isAdmin: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  lastAddedChallenge: { type: Date },
  badges: [
    {
      badge: { type: Schema.Types.ObjectId, ref: "Badge" },
      _id: false,
    },
  ],
  habits: [
    {
      habit: { type: Schema.Types.ObjectId, ref: "Habit" },
      _id: false,
    },
  ],
  challenges: [
    {
      challenge: { type: Schema.Types.ObjectId, ref: "Challenge" },
      _id: false,
    },
  ],
  streak: {
    count: { type: Number, default: 0 },
    lastCheckInDate: { type: Date },
  },
});

export default mongoose.model("User", UserSchema);
