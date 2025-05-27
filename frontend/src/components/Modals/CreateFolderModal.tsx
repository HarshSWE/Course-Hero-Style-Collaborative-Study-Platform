import React from "react";
import { useFolderContext } from "../ContextProviders/FolderContext";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface Folder {
  _id: string;
  name: string;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { folders, setFolders, folderName, setFolderName } = useFolderContext();

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!folderName.trim()) {
      alert("Folder name is required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to create a folder.");
        return;
      }
      const response = await fetch("http://localhost:5000/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: folderName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || "Error creating folder.");
        return;
      }

      const createdFolder = await response.json();
      console.log("Created folder:", createdFolder);

      setFolders([...folders, createdFolder]);

      setFolderName("");

      onClose();
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("An error occurred while creating the folder.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded p-6 w-80 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Create New Folder</h2>
        <input
          type="text"
          placeholder="Folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring focus:border-blue-500"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateFolderModal;
