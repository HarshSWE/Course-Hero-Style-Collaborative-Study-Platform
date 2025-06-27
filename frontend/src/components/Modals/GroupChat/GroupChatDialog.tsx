import React, { useState, useRef } from "react";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

interface GroupChatDialogProps {
  show: boolean;
  newGroupName: string;
  setNewGroupName: (value: string) => void;
  setShowCreateDialog: (value: boolean) => void;
  setGroupChats: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedChatId: (id: string) => void;
}

const GroupChatDialog: React.FC<GroupChatDialogProps> = ({
  show,
  newGroupName,
  setNewGroupName,
  setShowCreateDialog,
  setGroupChats,
  setSelectedChatId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  // Handle file selection and preview generation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Handle creation of new group chat (form submission)
  const handleCreate = async () => {
    if (!newGroupName.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", newGroupName.trim());
      if (selectedFile) {
        formData.append("picture", selectedFile);
      }

      const res = await fetch("http://localhost:5000/group-chats", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      setGroupChats((prev) => [...prev, data.newGroupChat]);
      setSelectedChatId(data.newGroupChat._id);
      setShowCreateDialog(false);
      setNewGroupName("");
      setSelectedFile(null);
      setPreviewImage(null);
    } catch (err) {
      console.error("Failed to create group chat:", err);
    }
  };

  // Handle cancel action — closes dialog and resets state
  const handleCancel = () => {
    setShowCreateDialog(false);
    setNewGroupName("");
    setSelectedFile(null);
    setPreviewImage(null);
  };

  // Programmatically open the file input when avatar placeholder is clicked
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[300px] space-y-4">
        <h2 className="text-lg font-bold">Create Group Chat</h2>

        <div className="flex justify-center">
          <div
            className="w-24 h-24 rounded-full border border-gray-400 flex items-center justify-center cursor-pointer overflow-hidden relative"
            onClick={triggerFileInput}
          >
            {previewImage ? (
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-gray-500">
                <PersonOutlineIcon style={{ fontSize: 40 }} />
                <div className="text-xs">Upload</div>
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          type="text"
          placeholder="Group name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />

        <div className="flex justify-between gap-x-4 mt-4">
          <button
            onClick={handleCancel}
            className="flex-1 bg-red-600 text-white font-semibold px-4 py-2 rounded-xl shadow-md hover:bg-red-700 hover:scale-[1.03] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl shadow-md hover:bg-blue-700 hover:scale-[1.03] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatDialog;
