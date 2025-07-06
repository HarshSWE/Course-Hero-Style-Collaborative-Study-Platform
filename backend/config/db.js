import mongoose from "mongoose";

// Function to establish a connection to MongoDB database
export const connectDB = async () => {
  try {
    // Connect to MongoDB via connection string in .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error ${error.message}`);

    process.exit(1);
  }
};
