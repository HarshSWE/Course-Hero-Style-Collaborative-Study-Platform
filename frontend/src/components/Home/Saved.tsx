import { useEffect, useState, useRef } from "react";
import IconButton from "@mui/material/IconButton";
import ConfirmDeleteModal from "../Modals/ConfirmDeleteModal";
import CommentsModal from "../Modals/CommentsModal";
import { useNotifications } from "../ContextProviders/NotificationsContext";
import AddIcon from "@mui/icons-material/Add";
import CreateFolderModal from "../Modals/CreateFolderModal";
import AddToFolderDropdown from "../Modals/AddToFolderDropdown";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { useFolderContext } from "../ContextProviders/FolderContext";
import FileCard from "../ContainerCards/FileCard";
import useClickOutside from "../Hooks/useClickOutside";

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
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [folderDropDown, setFolderDropDown] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const { folders, fetchFolders } = useFolderContext();

  const { notifications } = useNotifications();

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchBookmarkedFiles();
    fetchFolders();
  }, []);

  // Custom hook that closes the folder dropdown if a click occurs outside it
  useClickOutside(
    dropdownRef,
    () => {
      setFolderDropDown(null);
    },
    folderDropDown !== null
  );

  const handleDeleteClick = (file: File) => {
    if (dontAskAgain) {
      unbookmarkFile(file._id);
    } else {
      setFileToDelete(file);
      setShowModal(true);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const fetchBookmarkedFiles = async () => {
    try {
      const res = await fetch("http://localhost:5000/bookmarks/all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setBookmarkedFiles(
        data.filter(
          (file: null | undefined) => file !== null && file !== undefined
        )
      );
    } catch (err) {
      console.error("Error fetching bookmarked files:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilesFromFolder = async (folderId: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/folders/${folderId}/files`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();
      setBookmarkedFiles(data);
    } catch (err) {
      console.error("Error fetching files for folder:", err);
    } finally {
      setLoading(false);
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

      setBookmarkedFiles((prev) =>
        prev.filter((file) => file && file._id !== fileId)
      );
    } catch (err) {
      console.error("Error unbookmarking file:", err);
    }
  };

  // Filter bookmarked files by search term (case-insensitive match on originalname or filename)
  const filteredFiles = bookmarkedFiles.filter((file) => {
    const name = file?.originalname?.toLowerCase() || "";
    const filename = file?.filename?.toLowerCase() || "";
    return (
      name.includes(searchTerm.toLowerCase()) ||
      filename.includes(searchTerm.toLowerCase())
    );
  });

  if (loading)
    return <div className="text-center p-4">Loading saved files...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col items-start space-y-3">
          <h2 className="text-2xl font-bold">Saved</h2>
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-full hover:border-black transition text-gray-800 hover:text-black"
          >
            <AddIcon fontSize="small" className="text-black" />
            <span className="font-medium text-black">Create Folder</span>
          </button>
        </div>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm w-48 focus:outline-none focus:ring-0 hover:border-black"
        />
      </div>
      {/* Grid displaying bookmarked files or "no files" message */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
        {bookmarkedFiles.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">
            No files saved yet.
          </div>
        ) : (
          filteredFiles.map((file) => {
            if (!file || !file.filename) return null;
            const fileUrl = `http://localhost:5000/uploads/${file.filename}`;

            return (
              <div
                key={file._id}
                className="group relative border border-gray-300 rounded-lg shadow hover:shadow-lg transition cursor-pointer hover:border-black"
              >
                {/* Dropdown for adding file to folder */}
                <div
                  ref={folderDropDown === file._id ? dropdownRef : null}
                  className={`absolute transition duration-200 z-20 transform -translate-x-1/2 ${
                    folderDropDown === file._id
                      ? "left-[30%] -top-8"
                      : "left-1/2 -top-10"
                  }`}
                >
                  {folderDropDown === file._id ? (
                    <AddToFolderDropdown
                      fileId={file._id}
                      onFileAdded={() => {
                        setFolderDropDown(null);
                      }}
                    />
                  ) : (
                    <IconButton
                      size="small"
                      className="!bg-blue-500 hover:!bg-blue-600 text-white opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFolderDropDown(file._id);
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  )}
                </div>
                {/* FileCard component to show file info, comment & delete buttons */}
                <FileCard
                  file={file}
                  fileUrl={fileUrl}
                  onCommentClick={() => setActiveFileForComments(file)}
                  onDeleteClick={(file) => handleDeleteClick(file)}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Fixed footer showing folder filters */}
      <div className="fixed bottom-0 left-0 w-full border-t border-gray-300 p-4 shadow bg-white z-50">
        <div className="flex flex-wrap gap-4">
          {/* "All" button resets folder filter */}
          <div
            onClick={() => {
              setSelectedFolderId(null);
              fetchBookmarkedFiles();
            }}
            className={`flex items-center space-x-2 border rounded-full px-3 py-1 cursor-pointer transition ${
              selectedFolderId === null
                ? "border-black bg-gray-100"
                : "border-gray-300"
            }`}
          >
            <FolderOpenIcon className="text-blue-500 w-10 h-10" />
            <span className="text-sm font-medium">All</span>
          </div>
          {/* Buttons for each folder to filter files */}
          {folders.length > 0 &&
            folders.map((folder) => (
              <div
                key={folder._id}
                onClick={() => {
                  if (selectedFolderId === folder._id) {
                    setSelectedFolderId(null);
                    fetchBookmarkedFiles();
                  } else {
                    setSelectedFolderId(folder._id);
                    fetchFilesFromFolder(folder._id);
                  }
                }}
                className={`flex items-center space-x-2 border rounded-full px-3 py-1 cursor-pointer transition ${
                  selectedFolderId === folder._id
                    ? "border-black bg-gray-100"
                    : "border-gray-300"
                }`}
              >
                <FolderOpenIcon className="text-blue-500 w-10 h-10" />
                <span className="text-base font-semibold">{folder.name}</span>
              </div>
            ))}
        </div>
      </div>
      {/* Modal to create a new folder */}
      {showCreateFolderModal && (
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
        />
      )}
      {/* Modal to confirm file deletion */}
      {showModal && fileToDelete && (
        <ConfirmDeleteModal
          isOpen={showModal}
          filename={fileToDelete.filename}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowModal(false)}
          onDontAskAgain={handleDontAskAgain}
        />
      )}

      {/* Comments modal for currently selected file */}
      {activeFileForComments && (
        <CommentsModal
          isOpen={true}
          onClose={() => setActiveFileForComments(null)}
          fileURL={`http://localhost:5000/uploads/${activeFileForComments.filename}`}
          notifications={notifications}
        />
      )}
    </div>
  );
};

export default Saved;
