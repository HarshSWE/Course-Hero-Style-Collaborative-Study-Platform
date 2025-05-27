import { fileModel } from "../models/file.model.js";
import { commentModel } from "../models/comment.model.js";

export async function getUserStats(userId) {
  const files = await fileModel.find({ userId }).select("title views saves");
  const comments = await commentModel.find({ userId }).select("text netVotes");

  const totalViews = files.reduce((sum, f) => sum + (f.views || 0), 0);
  const totalSaves = files.reduce((sum, f) => sum + (f.saves || 0), 0);
  const totalNetVotes = comments.reduce((sum, c) => sum + (c.netVotes || 0), 0);

  return { totalViews, totalSaves, totalNetVotes, files, comments };
}
