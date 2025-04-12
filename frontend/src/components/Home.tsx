import UploadFileIcon from "@mui/icons-material/UploadFile";
import React, { useState } from "react";

const Home = () => {
  const [title, setTitle] = useState("Welcome, User");

  function handleClickYourNotes() {
    setTitle("Your Notes");
  }

  function handleClickSaved() {
    setTitle("Saved");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full bg-white shadow px-6 py-4 flex items-center justify-between">
        <div className="flex-1 flex justify-center transform translate-x-[10px]">
          <input
            type="text"
            placeholder="Search for Documents..."
            className="w-full max-w-xl px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button className="ml-4 text-gray-700 font-semibold hover:text-red-600 transition">
          Logout
        </button>
      </div>

      <div className="flex px-8 py-6">
        <div className="space-y-4 mr-10">
          <button className="flex flex-col items-center justify-center w-28 h-20 border-2 border-dashed border-blue-400 rounded-md hover:border-blue-600 transition bg-white shadow">
            <UploadFileIcon style={{ fontSize: 28, color: "#1e3a8a" }} />
            <span className="mt-1 text-sm font-medium text-blue-900">
              Upload
            </span>
          </button>

          <button
            onClick={handleClickYourNotes}
            className="w-28 h-12 bg-white shadow transform -skew-x-6 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition font-medium"
            style={{ transform: "skewX(-12deg)" }}
          >
            <span className="transform skew-x-12">Your Notes</span>
          </button>

          <button
            onClick={handleClickSaved}
            className="w-28 h-12 bg-white shadow transform -skew-x-6 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition font-medium"
            style={{ transform: "skewX(-12deg)" }}
          >
            <span className="transform skew-x-12">Saved Notes</span>
          </button>
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold mb-4 transform -translate-x-[100px]">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Home;
