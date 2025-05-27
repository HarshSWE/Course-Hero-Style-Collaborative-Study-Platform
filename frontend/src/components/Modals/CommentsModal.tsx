import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import { PhotoProvider, PhotoView } from "react-photo-view";
import CommentSection from "../Comments/CommentSection";

type Notification = {
  _id: string;
  recipient: string;
  file: string;
  messageBy: string;
  isRead: boolean;
  createdAt: string;
  preview: string;
  commentReference: string;
};

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileURL?: string;
  previewText?: string | null;
  commentReference?: string;
  notifications?: Notification[];
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  fileURL,
  previewText,
  commentReference,
  notifications,
}) => {
  if (!isOpen) return null;

  const filename = fileURL?.split("/").pop() || "";

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white w-[1300px] h-[600px] rounded-lg shadow-lg flex overflow-hidden relative">
        <div className="w-1/2 p-6 border-r border-gray-300 overflow-auto">
          <h2 className="text-xl font-semibold mb-4">File Preview</h2>
          {filename.endsWith(".pdf") ? (
            <iframe
              src={fileURL}
              title={filename}
              className="w-full h-[90%] object-contain"
            />
          ) : filename.match(/\.(jpg|jpeg|png|gif)$/i) ? (
            <PhotoProvider>
              <PhotoView src={fileURL || ""}>
                <div className="cursor-zoom-in">
                  <img
                    src={fileURL}
                    alt={filename}
                    className="max-w-full max-h-[480px] object-contain mx-auto"
                  />
                </div>
              </PhotoView>
            </PhotoProvider>
          ) : (
            <div className="p-4 text-gray-500 text-sm border-t">
              No preview available for this file type.
            </div>
          )}
        </div>

        <div>
          <CommentSection
            filename={filename}
            previewText={previewText}
            commentReference={commentReference}
            notifications={notifications}
          />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

export default CommentsModal;
