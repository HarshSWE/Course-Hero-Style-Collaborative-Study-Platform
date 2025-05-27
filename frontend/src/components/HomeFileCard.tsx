import React, { RefObject, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as farBookmark } from "@fortawesome/free-regular-svg-icons";
import InsertCommentIcon from "@mui/icons-material/InsertComment";
import AddToFolderDropdown from "./AddToFolderDropdown";
import CommentsModal from "./Modals/CommentsModal";

interface HomeFileCardProps {
  isOpen: boolean;
  selectedFile: any;
  folderDropdown: boolean | null;
  selectedBookmarkFileId: string | null;
  bookmarkedFiles: Set<string>;
  toggleBookmark: (fileId: string) => void;
  setFolderDropdown: (value: boolean) => void;
  setSelectedBookmarkFileId: (value: string | null) => void;
  dropdownRef: RefObject<HTMLDivElement | null>;
  setShowComments: (value: boolean) => void;
  showComments: boolean;
  notifications: any[];
  onClose: () => void;
}

const HomeFileCard: React.FC<HomeFileCardProps> = ({
  isOpen,
  selectedFile,
  folderDropdown,
  selectedBookmarkFileId,
  bookmarkedFiles,
  toggleBookmark,
  setFolderDropdown,
  setSelectedBookmarkFileId,
  dropdownRef,
  setShowComments,
  showComments,
  notifications,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      console.log("Bookmarked files:", bookmarkedFiles);
    }
  }, [isOpen, bookmarkedFiles]);
  if (!isOpen || !selectedFile) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-5xl h-[90vh] relative flex flex-col">
        {folderDropdown && selectedBookmarkFileId === selectedFile._id && (
          <div ref={dropdownRef}>
            <AddToFolderDropdown
              fileId={selectedFile._id}
              onFileAdded={() => {
                setFolderDropdown(false);
                setSelectedBookmarkFileId(null);
              }}
            />
          </div>
        )}

        <button
          onClick={() => toggleBookmark(selectedFile._id)}
          className="absolute top-2 left-2 text-2xl text-blue-500"
          title="Bookmark"
        >
          {bookmarkedFiles.has(selectedFile._id) ? (
            <FontAwesomeIcon icon={faBookmark} />
          ) : (
            <FontAwesomeIcon icon={farBookmark} />
          )}
        </button>

        <button
          onClick={() => setShowComments(true)}
          className="absolute top-2 left-1/2 transform -translate-x-1/2 text-blue-500"
          title="View Comments"
        >
          <InsertCommentIcon fontSize="large" />
        </button>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
        >
          &times;
        </button>

        <div className="mb-4 mt-8 text-center">
          <h2 className="text-xl font-semibold">{selectedFile.originalname}</h2>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {selectedFile.filename.toLowerCase().endsWith(".pdf") ? (
            <iframe
              src={`http://localhost:5000/uploads/${selectedFile.filename}`}
              className="w-full h-full"
              title="PDF Preview"
            />
          ) : selectedFile.filename.match(/\.(jpg|jpeg|png|gif)$/) ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={`http://localhost:5000/uploads/${selectedFile.filename}`}
                alt="Uploaded file"
                className="object-contain max-h-full max-w-full"
              />
            </div>
          ) : (
            <p>Preview not available for this file type.</p>
          )}

          {showComments && (
            <div className="absolute inset-0 bg-white bg-opacity-80 overflow-y-auto">
              <CommentsModal
                isOpen={true}
                fileURL={`http://localhost:5000/uploads/${selectedFile.filename}`}
                onClose={() => setShowComments(false)}
                notifications={notifications}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeFileCard;
