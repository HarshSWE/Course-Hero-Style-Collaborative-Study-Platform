import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: string;
  name: string;
  exp: number;
  iat: number;
}

interface Comment {
  id: string;
  text: string;
  parentId: string | null;
  createdAt: Date;
  fileId: string;
  userId: string;
}

interface CommentSectionProps {
  filename: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ filename }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [fileId, setFileId] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  const getFileIdFromFilename = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:5000/file-id/${filename}`);
      if (!response.ok) {
        throw new Error("Failed to fetch file ID.");
      }
      const data = await response.json();
      return data.fileId;
    } catch (error) {
      console.error("Error fetching file ID:", error);
      return null;
    }
  };

  const fetchFileId = async () => {
    const fileId = await getFileIdFromFilename(filename);
    setFileId(fileId);
    console.log("File ID is:", fileId);
  };

  fetchFileId();

  // filename to id of file denoted by _id in database works

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded: DecodedToken = jwtDecode(token);
      console.log("Logged in userId:", decoded.id);
      setUserId(decoded.id);
    }
  }, []);

  // id of user denoted by _id in database works

  const addComment = async (text: string, parentId: string | null = null) => {
    try {
      // Check if fileId and userId are set
      if (!fileId || !userId) {
        throw new Error("fileId and userId are required.");
      }

      const response = await fetch("http://localhost:5000/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          userId,
          parentId,
          content: text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      // Get the newly created comment
      const newComment = await response.json();
      console.log("Comment posted:", newComment);

      // Update the state with the new comment
      setComments((prev) => [
        ...prev,
        {
          id: newComment._id, // or whatever identifier you use for the comment
          text: newComment.content,
          parentId: newComment.parentId,
          createdAt: new Date(newComment.createdAt),
          fileId: newComment.fileId,
          userId: newComment.userId,
        },
      ]);
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };
  // Add comment when there are no comments and post is clicked works, it saves to database

  const deleteComment = async (id: string) => {
    try {
      // Send DELETE request to backend to mark the comment as deleted
      const response = await fetch(`http://localhost:5000/comment/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment.");
      }

      // Get the updated comment from the backend (which will have deleted: true)
      const deletedComment = await response.json();

      // Update the local state after successful deletion to mark the comment as [deleted]
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === id
            ? { ...comment, text: "[deleted]", deleted: true }
            : comment
        )
      );

      console.log("Comment marked as deleted.");
    } catch (error) {
      console.error("Error marking comment as deleted:", error);
    }
  };
  // Delete Comment works, it deletes comment from database

  const updateComment = async (id: string, newText: string) => {
    try {
      // Call the backend route to update the comment in the database
      const response = await fetch(`http://localhost:5000/comment/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newText, // Send the updated content to the backend
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      const updatedComment = await response.json();

      // Update the comment in the local state to reflect the changes
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === id
            ? { ...comment, text: updatedComment.content }
            : comment
        )
      );
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };
  // Update Comment works, edits value in database

  // Replying works up to this point:
  // replied comment shows up, saved in database, and it's parent id is assigned correctly

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const fetchAllComments = async (fileId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/all-comments?fileId=${fileId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch comments.");
      }

      const data = await response.json();

      const formattedComments: Comment[] = data.map((c: any) => ({
        id: c._id,
        text: c.content,
        parentId: c.parentId,
        createdAt: new Date(c.createdAt),
        fileId: c.fileId,
        userId: c.userId,
      }));

      setComments(formattedComments);
      console.log("Formatted comments:", formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    if (fileId) {
      fetchAllComments(fileId); // Pass fileId to fetchAllComments function
    }
  }, [fileId]);

  // userId (_id of users collection in db) to name

  // Works, does retrieve comments by fileId
  const renderComments = (parentId: string | null = null) => {
    return comments
      .filter((comment) => comment.parentId === parentId)
      .map((comment) => (
        <div
          key={comment.id}
          className="ml-4 mt-2 border-l border-gray-300 pl-4"
        >
          <CommentItem
            comment={comment}
            onReply={addComment}
            onDelete={deleteComment}
            onEdit={updateComment}
            hasChildren={comments.some((c) => c.parentId === comment.id)}
            isCollapsed={collapsedIds.has(comment.id)}
            onToggleCollapse={() => toggleCollapse(comment.id)}
          />
          {!collapsedIds.has(comment.id) && renderComments(comment.id)}
        </div>
      ));
  };

  return (
    <div className=" inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 w-[650px]  max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Comments</h2>
        </div>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            className="flex-1 border rounded p-2"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newComment.trim() !== "") {
                addComment(newComment);
                setNewComment("");
              }
            }}
          />
          <button
            onClick={() => {
              if (newComment.trim() !== "") {
                addComment(newComment);
                setNewComment("");
              }
            }}
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            Post
          </button>
        </div>
        <div>{renderComments()}</div>
      </div>
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  onReply: (text: string, parentId: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  hasChildren: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onDelete,
  onEdit,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between"></div>
      <div className="flex items-center justify-between">
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

export default CommentSection;
