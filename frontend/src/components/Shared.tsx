import { useEffect, useState } from "react";
import ConfirmDeleteModal from "./Modals/ConfirmDeleteModal";
import CommentsModal from "./Modals/CommentsModal";
import { useNotifications } from "./ContextProviders/NotificationsContext";
import FileCard from "./FileCard";

interface File {
  _id: string;
  originalname: string;
  filename: string;
  course: string;
  school: string;
}

const Shared = () => {
  const [sharedFiles, setSharedFiles] = useState<File[]>([]);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(
    sessionStorage.getItem("dontAskAgain") === "true"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFileForComments, setActiveFileForComments] =
    useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const { notifications } = useNotifications();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/file/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch files");
        const data = await res.json();
        setSharedFiles(data);
      } catch (err) {
        console.error("Error fetching files:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleCommentClick = (file: File) => {
    setActiveFileForComments(file);
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

  const deleteFile = async (file: File) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/file/${file.filename}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");

      setSharedFiles((prev) => prev.filter((f) => f._id !== file._id));
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const cleanFileName = (filename: string) => filename.replace(/^\d+-/, "");

  const filteredFiles = sharedFiles.filter((file) => {
    const name = file?.originalname?.toLowerCase() || "";
    const filename = file?.filename?.toLowerCase() || "";
    return (
      name.includes(searchTerm.toLowerCase()) ||
      filename.includes(searchTerm.toLowerCase())
    );
  });

  if (loading)
    return <div className="text-center p-4">Loading saved files...</div>;

  if (sharedFiles.length === 0) {
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
          className="border border-gray-300 rounded-md px-3 py-1 text-sm w-48 focus:outline-none focus:ring-0 hover:border-black"
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
              <FileCard
                file={file}
                fileUrl={fileUrl}
                onCommentClick={() => handleCommentClick(file)}
                onDeleteClick={(file) => handleDeleteClick(file)}
              />
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

      {activeFileForComments && (
        <>
          {console.log(activeFileForComments.filename)}
          <CommentsModal
            isOpen={true}
            onClose={() => setActiveFileForComments(null)}
            fileURL={`http://localhost:5000/uploads/${activeFileForComments.filename}`}
            notifications={notifications}
          />
        </>
      )}
    </div>
  );
};

export default Shared;
