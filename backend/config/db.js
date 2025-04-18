// Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js.
// Let's you define schemas
// Handles validation, querying, and even relationships between data.
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    //.connection gives u info about the actual mongoDB connection
    // .host gives you the hostname of the MongoDB server you're connected to.

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error ${error.message}`);
    //code 1 means failure, 0 means success
    process.exit(1);
  }
};
