import mongoose from "mongoose";

const cvSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  extractedData: {
    type: Object, 
    required: true,
  },
  atsScore: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CvModel = mongoose.model("CV", cvSchema);
export default CvModel;
