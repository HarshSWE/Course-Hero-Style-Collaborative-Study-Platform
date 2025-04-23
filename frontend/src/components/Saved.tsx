import React, { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import { PhotoProvider, PhotoView } from "react-photo-view";

interface File {
  _id: string;
  originalname: string;
  filename: string;
  path: string;
  userId: string;
  course: string;
  school: string;
}

const Saved = () => {
  const [bookmarkedFiles, setBookmarkedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [dontAskAgain, setDontAskAgain] = useState(
    sessionStorage.getItem("dontAskAgain") === "true"
  );

  useEffect(() => {
    const fetchBookmarkedFiles = async () => {
      try {
        const res = await fetch("http://localhost:5000/bookmarked-files", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        setBookmarkedFiles(data);
      } catch (err) {
        console.error("Error fetching bookmarked files:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedFiles();
  }, []);

  const handleDeleteClick = (fileId: string) => {
    if (dontAskAgain) {
      unbookmarkFile(fileId);
    } else {
      setSelectedFileId(fileId);
      setShowModal(true);
    }
  };

  const unbookmarkFile = async (fileId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/unbookmark/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to unbookmark");

      setBookmarkedFiles((prev) =>
        prev.filter((file) => file && file._id !== fileId)
      );
    } catch (err) {
      console.error("Error unbookmarking file:", err);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedFileId) {
      unbookmarkFile(selectedFileId);
      setSelectedFileId(null);
      setShowModal(false);
    }
  };

  const handleDontAskAgain = () => {
    sessionStorage.setItem("dontAskAgain", "true");
    setDontAskAgain(true);
    handleConfirmDelete();
  };

  if (loading)
    return <div className="text-center p-4">Loading saved files...</div>;

  if (bookmarkedFiles.length === 0)
    return <div className="text-center p-4">No files saved yet.</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Saved</h2>
      {/* On small screens set to one column, on medium screen set to 2 columns, large screens 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarkedFiles.map((file) => {
          if (!file || !file.filename) return null;

          const fileUrl = `http://localhost:5000/uploads/${file.filename}`;

          return (
            <div
              key={file._id}
              className="relative border border-gray-300 rounded-lg shadow hover:shadow-lg transition cursor-pointer hover:border-black"
              // onClick={() => window.open(fileUrl, "_blank")}
            >
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(file._id);
                }}
                className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>

              <div className="p-4">
                <p className="font-semibold text-lg">{file.originalname}</p>
                <p className="text-sm text-black-500">
                  {/* ^ Start of the string
                  \d+	 one or more digits
                  - a literal dash
                  Replace the matched part with an empty string (i.e. remove it)  
                  The / at the start and end tell js this is regex  */}
                  {file.filename.replace(/^\d+-/, "")}
                </p>
                <p className="text-sm text-black-500">
                  {file.course} · {file.school}
                </p>
              </div>

              {file.filename.endsWith(".pdf") ? (
                <iframe
                  src={fileUrl}
                  title={file.originalname}
                  className="w-11/12 h-64 object-contain border-t mx-auto"
                />
              ) : file.filename.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <PhotoProvider>
                  <PhotoView src={fileUrl}>
                    <div>
                      <img src={fileUrl} alt={file.originalname} />
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

      {/* Modal */}
      {showModal && selectedFileId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm text-center space-y-4">
            <p className="text-lg font-semibold">
              Are you sure you want to delete{" "}
              <span className="text-black-600 font-bold">
                {bookmarkedFiles
                  .find((f) => f._id === selectedFileId)
                  ?.filename.replace(/^\d+-/, "")}
              </span>
              ?
            </p>
            <div className="flex justify-between gap-3 mt-4">
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg w-full"
              >
                Yes
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg w-full"
              >
                No
              </button>
            </div>
            <button
              onClick={handleDontAskAgain}
              className="text-sm text-blue-600 hover:underline"
            >
              Don’t ask again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saved;
