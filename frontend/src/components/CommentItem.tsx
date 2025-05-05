import React, { useState } from "react";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export interface Comment {
  id: string;
  text: string;
  parentId: string | null;
  createdAt: Date;
  fileId: string;
  userId: string;
  userName: string;
  profilePictureUrl: string | null;
}

export interface CommentItemProps {
  comment: Comment;
  onReply: (text: string, parentId: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  hasChildren: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userName: string;
  profilePictureUrl: string | null;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onDelete,
  onEdit,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
  userName,
  profilePictureUrl,
}) => {
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt="Profile"
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
              <PersonOutlineIcon className="text-white" fontSize="small" />
            </div>
          )}
          <span className="text-gray-500 text-sm">Posted By: {userName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onEdit(comment.id, editText);
                setIsEditing(false);
              }
            }}
            className="border p-1 rounded w-full mr-2"
          />
        ) : (
          <p className="text-gray-800">{comment.text}</p>
        )}
      </div>

      <div className="flex space-x-2 mt-1 text-sm text-gray-600 items-center">
        {isEditing ? (
          <>
            <button
              onClick={() => {
                onEdit(comment.id, editText);
                setIsEditing(false);
              }}
              className="text-green-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="text-red-500"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="hover:underline"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(comment.id)}
              className="hover:underline"
            >
              Delete
            </button>
            <button
              onClick={() => {
                if (replyText.trim() !== "") {
                  onReply(replyText, comment.id);
                  setReplyText("");
                }
              }}
              className="hover:underline"
            >
              Reply
            </button>
            {hasChildren && (
              <button onClick={onToggleCollapse} className="ml-1">
                {isCollapsed ? (
                  <ArrowDropDownIcon fontSize="small" />
                ) : (
                  <ArrowDropUpIcon fontSize="small" />
                )}
              </button>
            )}
          </>
        )}
      </div>

      <div className="mt-1">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && replyText.trim() !== "") {
              onReply(replyText, comment.id);
              setReplyText("");
            }
          }}
          placeholder="Reply..."
          className="border rounded p-1 mt-1 w-full"
        />
      </div>
    </div>
  );
};

export default CommentItem;
