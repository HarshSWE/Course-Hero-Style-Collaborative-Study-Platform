import React from "react";
import clsx from "clsx";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

type Message = {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    profilePictureUrl?: string;
  };
  content: string;
  profilePictureUrl?: string;
  createdAt: string;
  type: "text" | "system";
  files?: string[];
};

interface RenderMessagesProps {
  messages: Message[];
}

const RenderMessages: React.FC<RenderMessagesProps> = ({ messages }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-white">
      {messages?.length ? (
        messages.map((msg) =>
          // If system message (e.g. "User left the chat")
          msg.type === "system" ? (
            <div
              key={msg._id}
              className={clsx(
                "text-white text-xs text-center px-3 py-1 rounded-full w-fit mx-auto",
                msg.content.includes("left the chat")
                  ? "bg-red-300"
                  : "bg-green-300"
              )}
            >
              {msg.content}
            </div>
          ) : (
            // Regular user message
            <div key={msg._id} className="flex items-start gap-2">
              {msg.senderId.profilePictureUrl ? (
                <img
                  src={msg.senderId.profilePictureUrl}
                  alt={msg.senderId.name}
                  className="w-6 h-6 rounded-full object-cover mt-1"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 mt-1">
                  <PersonOutlineIcon fontSize="small" />
                </div>
              )}
              {/* Message content */}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  {/* Sender name */}
                  <span className="font-medium text-slate-900">
                    {msg.senderId.name}
                  </span>
                  {/* Timestamp */}
                  <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {/* Message bubble */}
                <div className="bg-slate-100 p-2 rounded-lg mt-1 text-slate-800 space-y-2 w-fit max-w-[75%]">
                  {/* Text content */}
                  {msg.content && <div>{msg.content}</div>}
                  {/* Attached files */}
                  {Array.isArray(msg.files) && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.files.map((fileUrl, index) => {
                        const fullUrl = `http://localhost:5000${fileUrl}`;
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                          fileUrl
                        );

                        return (
                          <div
                            key={index}
                            className="max-w-[200px] max-h-[200px]"
                          >
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              {/* Render image preview or file link */}
                              {isImage ? (
                                <img
                                  src={fullUrl}
                                  alt={`Uploaded ${index}`}
                                  className="rounded object-cover w-full h-auto max-h-[200px]"
                                />
                              ) : (
                                <span className="text-blue-500 underline break-all">
                                  {fileUrl.split("/").pop()}
                                </span>
                              )}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )
      ) : (
        <div className="text-slate-500 text-sm text-center">
          No messages yet.
        </div>
      )}
    </div>
  );
};

export default RenderMessages;
