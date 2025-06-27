import cron from "node-cron";
import fetch from "node-fetch";
import { userModel } from "../models/user.model.js";
import mongoose from "mongoose";

const BASE_URL = "http://localhost:5000";

// Function to start a scheduled cron job that generates AI User insights daily at 8:00 AM
export function startInsightCron() {
  cron.schedule("0 8 * * *", async () => {
    console.log(" Starting daily AI insight generation...");

    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
      }

      const users = await userModel.find({});

      const userIds = users.map((u) => u._id.toString());

      for (const userId of userIds) {
        try {
          const response = await fetch(
            `${BASE_URL}/generate-insight/${userId}`,
            {
              method: "POST",
            }
          );

          const data = await response.json();
          console.log(` Insight generated for ${userId}:`, data.notification);
        } catch (err) {
          console.error(
            ` Error generating insight for ${userId}:`,
            err.message
          );
        }
      }
    } catch (err) {
      console.error(" Error during cron job execution:", err.message);
    }
  });
}
