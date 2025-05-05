import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import CommentItem from "./CommentItem"; // ✅ Import your modularized component

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
  userName: string;
  profilePictureUrl: string | null;
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
  const [userName, setUserName] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePicture] = useState<string | null>(null);

  const getFileIdFromFilename = async (filename: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/file/fileId/${filename}`
      );
      if (!response.ok) throw new Error("Failed to fetch file ID.");
      const data = await response.json();
      return data.fileId;
    } catch (error) {
      console.error("Error fetching file ID:", error);
      return null;
    }
  };

  const fetchUserName = async (userId: string): Promise<void | null> => {
    try {
      const response = await fetch(`http://localhost:5000/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user details.");
      const data = await response.json();
      setUserName(data.name);
    } catch (error) {
      console.error("Error fetching user name:", error);
      return null;
    }
  };

  const fetchProfilePicture = async (userId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/user/profile-url/${userId}`
      );
      const data = await res.json();
      return res.ok ? data.profilePictureUrl : null;
    } catch (err) {
      console.error("Error fetching profile picture URL:", err);
      return null;
    }
  };

  useEffect(() => {
    const fetchFileId = async () => {
      const fileId = await getFileIdFromFilename(filename);
      setFileId(fileId || "");
    };
    fetchFileId();
  }, [filename]);

  useEffect(() => {
    if (fileId) {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded: DecodedToken = jwtDecode(token);
        setUserId(decoded.id);
      }
    }
  }, [fileId]);

  useEffect(() => {
    if (userId) {
      fetchUserName(userId);
      (async () => {
        const url = await fetchProfilePicture(userId);
        setProfilePicture(url);
      })();
    }
  }, [userId]);

  const addComment = async (text: string, parentId: string | null = null) => {
    try {
      if (!fileId || !userId || !userName)
        throw new Error("Missing user or file info.");
      const response = await fetch("http://localhost:5000/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          userId,
          parentId,
          content: text,
          userName,
          profilePictureUrl,
        }),
      });
      if (!response.ok) throw new Error("Failed to post comment");

      const newComment = await response.json();
      setComments((prev) => [
        ...prev,
        {
          id: newComment._id,
          text: newComment.content,
          parentId: newComment.parentId,
          createdAt: new Date(newComment.createdAt),
          fileId: newComment.fileId,
          userId: newComment.userId,
          userName: newComment.userName,
          profilePictureUrl: newComment.profilePictureUrl,
        },
      ]);
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/comment/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete comment.");
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === id ? { ...comment, text: "[deleted]" } : comment
        )
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const updateComment = async (id: string, newText: string) => {
    try {
      const response = await fetch(`http://localhost:5000/comment/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newText }),
      });
      if (!response.ok) throw new Error("Failed to update comment");
      const updated = await response.json();
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === id ? { ...comment, text: updated.content } : comment
        )
      );
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
  };

  const fetchAllComments = async (fileId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/comment/all?fileId=${fileId}`
      );
      if (!response.ok) throw new Error("Failed to fetch comments.");
      const data = await response.json();
      const formattedComments: Comment[] = data.map((c: any) => ({
        id: c._id,
        text: c.content,
        parentId: c.parentId,
        createdAt: new Date(c.createdAt),
        fileId: c.fileId,
        userId: c.userId,
        userName: c.userName,
        profilePictureUrl: c.profilePictureUrl,
      }));
      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    if (fileId) fetchAllComments(fileId);
  }, [fileId]);

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
            userName={comment.userName}
            profilePictureUrl={comment.profilePictureUrl}
          />
          {!collapsedIds.has(comment.id) && renderComments(comment.id)}
        </div>
      ));
  };

  return (
    <div className="inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 w-[650px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Comments</h2>
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

export default CommentSection;
