import React, { useState, useEffect } from "react";
import CommentItem from "./CommentItem";
import socket from "../Services/socketService";
import { useNotifications } from "../ContextProviders/NotificationsContext";
import { useUser } from "../ContextProviders/UserContext";

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

interface Comment {
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

interface CommentSectionProps {
  filename: string;
  previewText?: string | null;
  commentReference?: string;
  notifications?: Notification[];
}

const CommentSection: React.FC<CommentSectionProps> = ({
  filename,
  previewText,
  commentReference,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [fileId, setFileId] = useState<string>("");
  const { user } = useUser();
  const [profilePictureUrl, setProfilePicture] = useState<string | null>(null);
  const [scrollToPreview, setScrollToPreview] = useState(false);
  const [netVotes, setNetVotes] = useState<number>(0);
  const { notifications, setNotifications, setNotificationsCount } =
    useNotifications();

  // Fetch file ID and user profile picture on mount
  useEffect(() => {
    const init = async () => {
      try {
        const fetchedFileId = await getFileIdFromFilename(filename);
        if (!fetchedFileId) return;
        setFileId(fetchedFileId);
        if (user?._id) {
          const profileUrl = await fetchProfilePicture(user._id);
          if (profileUrl) setProfilePicture(profileUrl);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    init();
  }, [filename]);

  // Register user to socket room on login
  useEffect(() => {
    if (user?._id) {
      socket.emit("register", user?._id);
    }
  }, [user?._id]);

  // Handle real-time comment events from socket: add, delete, update
  useEffect(() => {
    socket.on("receiveComment", (comment) => {
      setComments((prev) => [
        ...prev,
        {
          id: comment._id,
          text: comment.content,
          parentId: comment.parentId,
          createdAt: new Date(comment.createdAt),
          fileId: comment.fileId,
          userId: comment.userId,
          username: comment.username,
          profilePictureUrl: comment.profilePictureUrl,
          netVotes: comment.netVotes,
        },
      ]);
    });

    socket.on("commentDeleted", ({ id }) => {
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, text: "[deleted]" } : c))
      );
    });

    socket.on("commentUpdated", ({ id, content }) => {
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, text: content } : c))
      );
    });

    return () => {
      socket.off("receiveComment");
      socket.off("commentDeleted");
      socket.off("commentUpdated");
    };
  }, []);

  // Fetch comments for file when fileId is available
  useEffect(() => {
    if (fileId) fetchAllComments(fileId);
  }, [fileId]);

  // Smooth-scroll to comment preview on opening via notification
  useEffect(() => {
    if (scrollToPreview && commentReference) {
      console.log("CommentRef", commentReference);
      const element = document.getElementById(`comment-${commentReference}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        element.classList.add(
          "bg-gray-100",
          "transition-colors",
          "p-3",
          "rounded-lg"
        );

        setTimeout(() => {
          element.classList.remove("bg-gray-100", "p-3", "rounded-lg");
        }, 2000);
      }
      setScrollToPreview(false);
    }
  }, [scrollToPreview, commentReference]);

  // Mark notifications as read when corresponding comment scrolls into view
  useEffect(() => {
    console.log("useEffect triggered. notifications:", notifications);

    if (!notifications || notifications.length === 0) return;

    console.log("Intersection observer effect ran");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const commentId = entry.target.id;

            notifications.forEach(async (notif) => {
              if (
                notif.commentReference === commentId &&
                notif.isRead === false
              ) {
                try {
                  await fetch(
                    `http://localhost:5000/notifications/mark-as-read/${notif._id}`,
                    {
                      method: "PATCH",
                    }
                  );
                  console.log(`Marked notification ${notif._id} as read`);

                  setNotifications((prev) =>
                    prev.filter((n) => n._id !== notif._id)
                  );

                  setNotificationsCount((prev) => Math.max(prev - 1, 0));
                } catch (err) {
                  console.error("Failed to mark notification as read", err);
                }
              }
            });
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.5,
      }
    );

    const commentElements = document.querySelectorAll("[id]");
    commentElements.forEach((el) => observer.observe(el));

    return () => {
      commentElements.forEach((el) => observer.unobserve(el));
    };
  }, [notifications, comments, setNotifications, setNotificationsCount]);

  // Handle posting a new top-level comment
  const handlePostComment = () => {
    if (newComment.trim() !== "") {
      addComment(newComment);
      setNewComment("");
    }
  };

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

  // Post new comment (top-level or reply)
  const addComment = async (text: string, parentId: string | null = null) => {
    try {
      if (!fileId || !user?._id || !user.name)
        throw new Error("Missing user or file info.");
      const response = await fetch("http://localhost:5000/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          userId: user._id,
          parentId,
          content: text,
          username: user.name,
          profilePictureUrl,
          netVotes,
        }),
      });
      if (!response.ok) throw new Error("Failed to post comment");

      const newComment = await response.json();
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
      socket.emit("deleteComment", { id });
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
      socket.emit("updateComment", { id, content: updated.content });
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  // Collapse/expand threaded replies for a comment
  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
  };

  // Fetch all comments for a given file
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
        username: c.username,
        profilePictureUrl: c.profilePictureUrl,
        netVotes: c.netVotes,
      }));
      setComments(formattedComments);
      if (previewText) {
        setScrollToPreview(true);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Render comments recursively as nested threads
  const renderComments = (parentId: string | null = null) => {
    return comments
      .filter((comment) => comment.parentId === parentId)
      .map((comment) => (
        <div
          key={comment.id}
          id={comment.id}
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
            username={comment.username}
            profilePictureUrl={comment.profilePictureUrl}
            netVotes={comment.netVotes}
            currentUserId={user?._id}
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
              if (e.key === "Enter") {
                e.preventDefault();
                handlePostComment();
              }
            }}
          />
          <button
            onClick={handlePostComment}
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
