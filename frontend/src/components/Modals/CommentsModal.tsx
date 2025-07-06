import React, { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { PhotoProvider, PhotoView } from "react-photo-view";
import CommentSection from "../Comments/CommentSection";
import ChatBotModal from "./ChatBotModal";
import { extractContentFromFile } from "../Utils/extractContentFromFile";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";

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
  const filename = fileURL?.split("/").pop() || "";
  const [extractedText, setExtractedText] = useState<string>("");

  // Effect to extract text from file whenever a new fileURL is provided
  useEffect(() => {
    if (!fileURL) return;

    const extractText = async () => {
      try {
        const text = await extractContentFromFile(fileURL);
        setExtractedText(text);
      } catch (err) {
        console.error("Failed to extract content from file.", err);
      }
    };

    extractText();
  }, [fileURL]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal background overlay */}
      <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
        {/* Modal content */}
        <div className="bg-white w-[1300px] h-[600px] rounded-lg shadow-lg flex overflow-hidden relative">
          {/* Left pane: file preview */}
          <div className="w-1/2 p-6 border-r border-gray-300 overflow-auto">
            <h2 className="text-xl font-semibold mb-4">File Preview</h2>
            {filename.endsWith(".pdf") ? (
              <iframe
                src={fileURL}
                title={filename}
                className="w-full h-[90%] object-contain"
              />
            ) : filename.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <PhotoProvider bannerVisible={false}>
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
          {/* Right pane: comment section */}
          <div className="w-1/2 p-6 overflow-auto flex flex-col">
            <CommentSection
              filename={filename}
              previewText={previewText}
              commentReference={commentReference}
              notifications={notifications}
            />
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white shadow hover:bg-red-100 transition"
          >
            <CloseIcon className="text-gray-700 hover:text-red-600 w-5 h-5" />
          </button>
        </div>
      </div>
      {/* Embedded chatbot modal, always rendered and fed with extracted file content */}
      <ChatBotModal content={extractedText} onClose={() => {}} />
    </>
  );
};

export default CommentsModal;
