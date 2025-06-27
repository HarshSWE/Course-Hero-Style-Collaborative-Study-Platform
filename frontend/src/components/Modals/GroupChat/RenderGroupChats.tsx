import React from "react";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import clsx from "clsx";

interface Chat {
  _id: string;
  name: string;
  groupPictureUrl?: string;
}

type Message = {
  _id: string;
  groupId: string;
  senderId: {
    _id: string;
    name: string;
    profilePictureUrl?: string;
  } | null;
  content: string;
  profilePictureUrl?: string;
  createdAt: string;
  type: "text" | "system" | "file";
  files?: string[];
};

interface RenderGroupChatsProps {
  groupChats: Chat[];
  selectedChatId: string;
  setSelectedChatId: (id: string) => void;
  handleLeaveGroupChat: (id: string) => void;
  setShowCreateDialog: (show: boolean) => void;
  unreadChatIds: string[];
  lastMessages: { [key: string]: Message | null };
}

const RenderGroupChats: React.FC<RenderGroupChatsProps> = ({
  groupChats,
  selectedChatId,
  setSelectedChatId,
  handleLeaveGroupChat,
  setShowCreateDialog,
  unreadChatIds,
  lastMessages,
}) => {
  return (
    <div className="w-[250px] bg-slate-50 border-r border-slate-200 overflow-y-auto">
      {/* Header: "Group Chats" with Add button */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
        <span className="font-semibold text-slate-800">Group Chats</span>
        <IconButton size="small" onClick={() => setShowCreateDialog(true)}>
          <AddIcon fontSize="small" />
        </IconButton>
      </div>
      {/* If there are any group chats, list them */}
      {groupChats?.length ? (
        groupChats.map((chat) => {
          const isUnread = unreadChatIds.includes(chat._id);
          const lastMessage = lastMessages[chat._id];

          return (
            // Single chat row
            <div
              key={chat._id}
              role="button"
              aria-selected={selectedChatId === chat._id}
              className={clsx(
                "cursor-pointer px-4 py-3 flex items-center gap-2 transition-all duration-150 border-b",
                selectedChatId === chat._id
                  ? "bg-white font-semibold shadow-inner ring-1 ring-inset ring-blue-500"
                  : isUnread
                  ? "bg-blue-50 font-medium"
                  : "hover:bg-slate-200"
              )}
              onClick={() => {
                setSelectedChatId(chat._id);
                // Mark unread chat as read on server
                if (isUnread) {
                  fetch(`http://localhost:5000/group-chats/${chat._id}/read`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  })
                    .then((res) => res.json())
                    .then(() => {})
                    .catch((err) =>
                      console.error("Failed to mark chat as read", err)
                    );
                }
              }}
            >
              {/* Chat image if exists, otherwise fallback icon */}
              {chat.groupPictureUrl ? (
                <img
                  src={chat.groupPictureUrl}
                  alt={chat.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-600">
                  <PersonOutlineIcon fontSize="small" />
                </div>
              )}

              {/* Chat name and last message preview */}
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="truncate text-slate-800">{chat.name}</span>
                <span
                  className={clsx(
                    "truncate text-xs mt-0.5",
                    isUnread && selectedChatId !== chat._id
                      ? "font-bold text-black"
                      : "font-normal text-slate-600"
                  )}
                >
                  {lastMessage
                    ? lastMessage.type === "system"
                      ? lastMessage.content
                      : `${lastMessage.senderId?.name || "Someone"}: ${
                          lastMessage.content
                        }`
                    : "No New Messages"}
                </span>
              </div>
              {/* Leave group button */}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLeaveGroupChat(chat._id);
                }}
              >
                <ExitToAppIcon fontSize="small" />
              </IconButton>
            </div>
          );
        })
      ) : (
        // Fallback if no group chats exist
        <div className="px-4 py-6 text-slate-500 text-sm">
          No group chats yet.
        </div>
      )}
    </div>
  );
};

export default RenderGroupChats;
