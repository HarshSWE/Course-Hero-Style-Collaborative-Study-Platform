import UploadFileIcon from "@mui/icons-material/UploadFile";
import React, { useState } from "react";
import FileUpload from "./FileUpload"; // make sure the path is correct

const Home = () => {
  const [showFileUpload, setShowFileUpload] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <div className="w-full bg-white shadow px-6 py-4 flex items-center justify-between">
        {/* Centered Search Bar */}
        <div className="ml-6 flex justify-center w-full">
          <input
            type="text"
            placeholder="Search for Documents..."
            className="ml-4 w-full max-w-xl px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Logout aligned to far right */}
        <button className="text-gray-700 font-semibold hover:text-red-600 transition">
          Logout
        </button>
      </div>

      <div className="flex px-8 py-6">
        {/* Sidebar buttons */}
        <div className="space-y-4 mr-10">
          <button
            onClick={() => setShowFileUpload(true)}
            className="w-28 h-12 bg-white shadow transform -skew-x-6 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition font-medium"
            style={{ transform: "skewX(-12deg)" }}
          >
            <span className="transform skew-x-12">Shared</span>
          </button>

          <button
            className="w-28 h-12 bg-white shadow transform -skew-x-6 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition font-medium"
            style={{ transform: "skewX(-12deg)" }}
          >
            <span className="transform skew-x-12">Saved</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {showFileUpload ? <FileUpload inlineMode /> : null}
        </div>
      </div>
    </div>
  );
};

export default Home;
