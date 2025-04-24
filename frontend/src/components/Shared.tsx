import React, { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import { PhotoProvider, PhotoView } from "react-photo-view";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

interface File {
  _id: string;
  filename: string;
  originalname?: string;
  course?: string;
  school?: string;
}

const Shared = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(
    sessionStorage.getItem("dontAskAgain") === "true"
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/myfiles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch files");
        const data = await res.json();
        setFiles(data);
      } catch (err) {
        console.error("Error fetching files:", err);
      }
    };

    fetchFiles();
  }, []);

  const deleteFile = async (file: File) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/file/${file.filename}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");

      setFiles((prev) => prev.filter((f) => f._id !== file._id));
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const handleDeleteClick = (file: File) => {
    if (dontAskAgain) {
      deleteFile(file);
    } else {
      setFileToDelete(file);
      setShowModal(true);
    }
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      deleteFile(fileToDelete);
      setFileToDelete(null);
      setShowModal(false);
    }
  };

  const handleDontAskAgain = () => {
    sessionStorage.setItem("dontAskAgain", "true");
    setDontAskAgain(true);
    handleConfirmDelete();
  };

  const cleanFileName = (filename: string) => filename.replace(/^\d+-/, "");

  const filteredFiles = files.filter((file) => {
    const name = file?.originalname?.toLowerCase() || "";
    const filename = file?.filename?.toLowerCase() || "";
    return (
      name.includes(searchTerm.toLowerCase()) ||
      filename.includes(searchTerm.toLowerCase())
    );
  });

  if (files.length === 0) {
    return <div className="text-center p-4">No files publicly shared yet.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Shared</h2>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFiles.map((file) => {
          const fileUrl = `http://localhost:5000/uploads/${file.filename}`;
          const ext = file.filename.split(".").pop()?.toLowerCase();

          return (
            <div
              key={file._id}
              className="relative border border-gray-300 rounded-lg shadow hover:shadow-lg transition cursor-pointer hover:border-black"
            >
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(file);
                }}
                className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>

              <div className="p-4">
                <p className="text-sm text-black-500">
                  {file.originalname ?? cleanFileName(file.filename)}
                </p>
                <p className="text-sm text-black-500">
                  {file.course} · {file.school}
                </p>
              </div>

              {ext === "pdf" ? (
                <iframe
                  src={fileUrl}
                  title={file.filename}
                  className="w-11/12 h-80 object-contain border-t mx-auto"
                />
              ) : ext?.match(/(jpg|jpeg|png|gif)/i) ? (
                <PhotoProvider>
                  <PhotoView src={fileUrl}>
                    <div>
                      <img src={fileUrl} alt={file.filename} />
                    </div>
                  </PhotoView>
                </PhotoProvider>
              ) : (
                <div className="p-4 text-gray-500 text-sm border-t">
                  No preview available for this file type
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && fileToDelete && (
        <ConfirmDeleteModal
          isOpen={showModal && !!fileToDelete}
          filename={fileToDelete?.filename}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowModal(false);
            setFileToDelete(null);
          }}
          onDontAskAgain={handleDontAskAgain}
          itemType="unshare"
        />
      )}
    </div>
  );
};

export default Shared;
