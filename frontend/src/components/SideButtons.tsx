import React from "react";
import { useNavigate } from "react-router-dom";

interface SideButtonsProps {
  setShowFileUpload: React.Dispatch<React.SetStateAction<boolean>>;
}

const SideButtons: React.FC<SideButtonsProps> = ({ setShowFileUpload }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 mr-10">
      <button
        onClick={() => {
          navigate("?upload=true");
          setShowFileUpload(true);
        }}
        className="w-44 h-12 bg-white shadow transform -skew-x-6 flex items-center justify-center border border-gray-300 hover:bg-blue-100 transition font-medium text-black"
        style={{ transform: "skewX(-12deg)" }}
      >
        <span className="transform skew-x-12 flex flex-col items-center leading-tight">
          <span>Share to</span>
          <span>Public</span>
        </span>
      </button>

      <button
        onClick={() => navigate("/saved")}
        className="w-44 h-12 bg-white shadow transform -skew-x-6 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition font-medium"
        style={{ transform: "skewX(-12deg)" }}
      >
        <span className="transform skew-x-12">Saved</span>
      </button>

      <button
        onClick={() => navigate("/shared")}
        className="w-44 h-12 bg-white shadow transform -skew-x-6 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition font-medium"
        style={{ transform: "skewX(-12deg)" }}
      >
        <span className="transform skew-x-12">Shared</span>
      </button>
    </div>
  );
};

export default SideButtons;
