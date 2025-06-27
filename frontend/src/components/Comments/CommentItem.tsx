import React, { useState, useEffect } from "react";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplyIcon from "@mui/icons-material/Reply";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useUser } from "../ContextProviders/UserContext";

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
  currentUserId: string | undefined;
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
  currentUserId,
}) => {
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [commentNetVotes, setCommentNetVotes] = useState(netVotes);
  const [isHovered, setIsHovered] = useState(false);
  const [isFriend, setIsFriend] = useState(true);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const token = localStorage.getItem("token");
  const { user } = useUser();
  const [friendRequestMessage, setFriendRequestMessage] = useState("");
  const [showFriendRequestMessage, setShowFriendRequestMessage] =
    useState(false);

  // On hover, check if commenter is a friend and if a friend request is already pending
  useEffect(() => {
    if (isHovered && currentUserId !== comment.userId) {
      // Check friend status
      fetch(
        `http://localhost:5000/user/${currentUserId}/is-friend/${comment.userId}`
      )
        .then((res) => {
          if (!res.ok) throw new Error("Failed to check friend status");
          return res.json();
        })
        .then((data) => setIsFriend(data.isFriend))
        .catch((err) => console.error("Error checking friend status", err));

      // Check pending friend request status
      fetch(
        `http://localhost:5000/notifications/check-friend-request/${currentUserId}/${comment.userId}`
      )
        .then((res) => {
          if (!res.ok) throw new Error("Failed to check friend request");
          return res.json();
        })
        .then((data) => setHasPendingRequest(data.exists))
        .catch((err) =>
          console.error("Error checking friend request status", err)
        );
    }
  }, [isHovered, currentUserId, comment.userId]);

  // Function to handle voting logic on a comment
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

  // Handle voting and update local state
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

  // Send a friend request to the comment author
  const handleSendFriendRequest = async () => {
    if (!token || !user) {
      console.error("User not authenticated");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/notifications/friend-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientId: comment.userId,
            messageBy: user.name,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send friend request");
      }

      console.log(data.message);
      setFriendRequestMessage("Friend request sent!");
      setShowFriendRequestMessage(true);

      setTimeout(() => {
        setShowFriendRequestMessage(false);
      }, 2000);
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className="mb-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Comment header: profile image, username, and friend request option */}
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
          {/* Friend request button (if not already a friend or pending) */}
          {isHovered &&
            !isFriend &&
            !hasPendingRequest &&
            currentUserId !== comment.userId && (
              <div className="relative">
                <button
                  onClick={handleSendFriendRequest}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <PersonAddIcon fontSize="small" />
                </button>

                {showFriendRequestMessage && (
                  <div className="absolute -top-8 left-0 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-90 transition-opacity duration-500">
                    {friendRequestMessage}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        {/* Comment text or edit input */}
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
        {/* Action buttons: edit, delete, reply, upvote, downvote, collapse */}
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
            {/* Collapse/expand replies button */}
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
      {/* Reply input box */}
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
