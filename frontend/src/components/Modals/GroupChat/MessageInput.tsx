import React, { Dispatch, SetStateAction, useRef } from "react";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import EmojiPicker from "emoji-picker-react";

interface MessageInputProps {
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  handleSend: () => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (value: boolean) => void;
  attachedFiles: File[];
  setAttachedFiles: Dispatch<SetStateAction<File[]>>;
}

const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  handleSend,
  showEmojiPicker,
  setShowEmojiPicker,
  attachedFiles,
  setAttachedFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col border-t bg-slate-50 px-4 py-2 gap-2 relative">
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {attachedFiles.map((file, index) => {
            const isImage = file.type.startsWith("image/");

            return (
              <div
                key={index}
                className="flex items-center gap-2 bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700"
              >
                {isImage ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <span className="truncate max-w-[120px]">{file.name}</span>
                )}
                <IconButton
                  size="small"
                  onClick={() => removeFile(index)}
                  className="text-slate-500"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        <IconButton onClick={() => fileInputRef.current?.click()}>
          <AttachFileIcon />
        </IconButton>

        <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          😊
        </IconButton>

        <IconButton onClick={handleSend} color="primary">
          <SendIcon />
        </IconButton>
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-14 right-14 z-50 shadow-lg rounded-md bg-white">
          <EmojiPicker
            onEmojiClick={(emojiData) =>
              setMessage((prev) => prev + emojiData.emoji)
            }
          />
        </div>
      )}
    </div>
  );
};

export default MessageInput;
