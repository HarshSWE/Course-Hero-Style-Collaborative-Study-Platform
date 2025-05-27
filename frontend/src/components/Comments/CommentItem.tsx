import React, { useState } from "react";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplyIcon from "@mui/icons-material/Reply";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export interface Comment {
  id: string;
  text: string;
  parentId: string | null;
  createdAt: Date;
  fileId: string;
  userId: string;
  username: string;
  profilePictureUrl: string | null;
  netVotes: number;
}

export interface CommentItemProps {
  comment: Comment;
  onReply: (text: string, parentId: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  hasChildren: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  username: string;
  profilePictureUrl: string | null;
  netVotes: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onDelete,
  onEdit,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
  username,
  profilePictureUrl,
  netVotes,
}) => {
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [commentNetVotes, setCommentNetVotes] = useState(netVotes);
  const token = localStorage.getItem("token");

  const voteOnComment = async (
    commentId: string,
    voteType: "upvote" | "downvote",
    token: string
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5000/comment/${commentId}/vote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ voteType }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to vote on comment");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error voting on comment:", error);
      throw error;
    }
  };

  const handleSaveEdit = () => {
    onEdit(comment.id, editText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleReply = () => {
    if (replyText.trim() !== "") {
      onReply(replyText, comment.id);
      setReplyText("");
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleDeleteClick = () => {
    onDelete(comment.id);
  };

  const handleToggleCollapse = () => {
    onToggleCollapse();
  };

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!token) {
      console.error("User not authenticated");
      return;
    }

    try {
      const data = await voteOnComment(comment.id, voteType, token);
      setCommentNetVotes(data.netVotes);
    } catch (err) {
      console.error("Voting failed", err);
    }
  };

  return (
    <div id={`comment-${comment.id}`} className="mb-2">
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
          <span className="text-gray-500 text-sm">Posted By: {username}</span>
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
                handleSaveEdit();
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
            <button onClick={handleSaveEdit} className="text-green-600">
              Save
            </button>
            <button onClick={handleCancelEdit} className="text-red-500">
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <button onClick={handleEditClick} className="hover:text-blue-500">
                <EditIcon fontSize="small" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="hover:text-red-500"
              >
                <DeleteIcon fontSize="small" />
              </button>
              <button onClick={handleReply} className="hover:text-blue-500">
                <ReplyIcon fontSize="small" />
              </button>
              <button
                onClick={() => handleVote("upvote")}
                className="hover:text-blue-500"
              >
                <ArrowUpwardIcon fontSize="small" />
              </button>

              <span className="text-sm font-medium">{commentNetVotes}</span>

              <button
                onClick={() => handleVote("downvote")}
                className="hover:text-red-500"
              >
                <ArrowDownwardIcon fontSize="small" />
              </button>
            </div>
            {hasChildren && (
              <button onClick={handleToggleCollapse} className="ml-1">
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
              handleReply();
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
