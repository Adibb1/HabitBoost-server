import mongoose, { Schema } from "mongoose";

const QuoteSchema = new Schema({
  text: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now, required: true },
});

export default mongoose.model("Quote", QuoteSchema);
