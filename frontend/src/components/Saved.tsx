import { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import { PhotoProvider, PhotoView } from "react-photo-view";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import InsertCommentIcon from "@mui/icons-material/InsertComment";
import CommentsModal from "./CommentsModal";

interface File {
  _id: string;
  originalname: string;
  filename: string;
  course: string;
  school: string;
}

const Saved = () => {
  const [bookmarkedFiles, setBookmarkedFiles] = useState<File[]>([]);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(
    sessionStorage.getItem("dontAskAgain") === "true"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFileForComments, setActiveFileForComments] =
    useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarkedFiles = async () => {
      try {
        const res = await fetch("http://localhost:5000/bookmarks/all", {
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

  const handleDeleteClick = (file: File) => {
    if (dontAskAgain) {
      unbookmarkFile(file._id);
    } else {
      setFileToDelete(file);
      setShowModal(true);
    }
  };

  const unbookmarkFile = async (fileId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/bookmarks/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to unbookmark");

      setBookmarkedFiles((prev) => prev.filter((file) => file._id !== fileId));
    } catch (err) {
      console.error("Error unbookmarking file:", err);
    }
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      unbookmarkFile(fileToDelete._id);
      setFileToDelete(null);
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Saved</h2>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarkedFiles
          .filter((file) => {
            const name = file?.originalname?.toLowerCase() || "";
            const filename = file?.filename?.toLowerCase() || "";
            return (
              name.includes(searchTerm.toLowerCase()) ||
              filename.includes(searchTerm.toLowerCase())
            );
          })
          .map((file) => {
            if (!file || !file.filename) return null;
            const fileUrl = `http://localhost:5000/uploads/${file.filename}`;

            return (
              <div
                key={file._id}
                className="relative border border-gray-300 rounded-lg shadow hover:shadow-lg transition cursor-pointer hover:border-black"
              >
                <InsertCommentIcon
                  fontSize="small"
                  className="absolute top-2 left-1/2 transform -translate-x-1/2 text-blue-500 cursor-pointer hover:text-blue-600"
                  onClick={() => setActiveFileForComments(file)}
                />
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
                  <p className="font-semibold text-lg">{file.originalname}</p>
                  <p className="text-sm text-black-500">
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
                    className="w-11/12 h-80 object-contain border-t mx-auto"
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

      {showModal && fileToDelete && (
        <ConfirmDeleteModal
          isOpen={showModal}
          filename={fileToDelete.filename}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowModal(false)}
          onDontAskAgain={handleDontAskAgain}
        />
      )}

      {activeFileForComments && (
        <CommentsModal
          isOpen={true}
          onClose={() => setActiveFileForComments(null)}
          fileURL={`http://localhost:5000/uploads/${activeFileForComments.filename}`}
        />
      )}
    </div>
  );
};

export default Saved;
