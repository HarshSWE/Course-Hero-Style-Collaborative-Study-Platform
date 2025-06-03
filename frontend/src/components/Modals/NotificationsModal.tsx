import React from "react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNotifications } from "../ContextProviders/NotificationsContext";
import CommentsModal from "./CommentsModal";

type NotificationModalProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showNotifications: boolean;
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  insights: any[];
  setInsights: React.Dispatch<React.SetStateAction<any[]>>;
  fetchFilename: (fileId: string) => void;
  setSelectedPreview: React.Dispatch<React.SetStateAction<string | null>>;
  setNotifCommentId: React.Dispatch<React.SetStateAction<string>>;
  showCommentSection: boolean;
  setShowCommentSection: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPreview: string | null;
  filename: string | null;
  notifCommentId: string;
  friendRequests: any[];
  setFriendRequests: React.Dispatch<React.SetStateAction<any[]>>;
};

const NotificationsModal: React.FC<NotificationModalProps> = ({
  activeTab,
  setActiveTab,
  showNotifications,
  setShowNotifications,
  insights,
  setInsights,
  fetchFilename,
  setSelectedPreview,
  setNotifCommentId,
  showCommentSection,
  setShowCommentSection,
  selectedPreview,
  filename,
  notifCommentId,
  friendRequests,
  setFriendRequests,
}) => {
  const { notifications, setNotifications } = useNotifications();

  const handleNotificationClick = (
    notif: any,
    isInsight: boolean,
    removeFromList: (id: string) => void
  ) => {
    fetch(`http://localhost:5000/notifications/mark-as-read/${notif._id}`, {
      method: "PATCH",
    })
      .then(() => {
        setSelectedPreview(notif.preview);
        setNotifCommentId(notif.commentReference);
        fetchFilename(notif.file);
        if (isInsight) {
          setShowCommentSection(true);
        }
        removeFromList(notif._id);
      })
      .catch((err) => console.error("Failed to mark as read", err));
  };

  const renderNotificationList = (
    items: any[],
    isInsight: boolean,
    removeFromList: (id: string) => void,
    emptyText: string
  ) => {
    return items.length > 0 ? (
      items.map((item) => (
        <div
          key={item._id}
          className="px-4 py-2 border-b hover:bg-gray-100 cursor-pointer"
          onClick={() =>
            handleNotificationClick(item, isInsight, removeFromList)
          }
        >
          <div className="font-medium">{item.messageBy}</div>
          {item.preview && (
            <div className="text-sm text-gray-700 italic mt-1">
              {item.preview}
            </div>
          )}
          <div className="text-xs text-gray-500">
            {new Date(item.createdAt).toLocaleString()}
          </div>
        </div>
      ))
    ) : (
      <div className="p-4 text-gray-500 text-center">{emptyText}</div>
    );
  };

  const totalNotificationsCount =
    notifications.length + insights.length + friendRequests.length;

  return (
    <div className="relative">
      <div className="relative">
        <NotificationsIcon
          className="text-blue-500 cursor-pointer hover:scale-110 transition"
          fontSize="medium"
          onClick={() => setShowNotifications((prev) => !prev)}
        />
        {totalNotificationsCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {totalNotificationsCount}
          </span>
        )}
      </div>

      <div className="relative">
        {showNotifications && (
          <div className="absolute top-8 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-50 overflow-y-auto max-h-96">
            <div className="flex justify-evenly border-b border-gray-300 bg-white">
              {["insights", "notifications", "friendRequests"].map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 text-center px-4 py-2 font-medium ${
                    activeTab === tab
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : ""
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "insights"
                    ? "Insights"
                    : tab === "notifications"
                    ? "Notifications"
                    : "Friend Requests"}
                </button>
              ))}
            </div>

            <div className="p-2">
              {activeTab === "notifications" ? (
                renderNotificationList(
                  notifications,
                  false,
                  (id) =>
                    setNotifications((prev) =>
                      prev.filter((n) => n._id !== id)
                    ),
                  "No notifications"
                )
              ) : activeTab === "insights" ? (
                renderNotificationList(
                  insights,
                  true,
                  (id) =>
                    setInsights((prev) => prev.filter((i) => i._id !== id)),
                  "No insights"
                )
              ) : activeTab === "friendRequests" ? (
                friendRequests.length > 0 ? (
                  friendRequests.map((item) => (
                    <div
                      key={item._id}
                      className="px-4 py-2 border-b flex flex-col gap-2"
                    >
                      <div className="font-medium">{item.messageBy}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="bg-green-500 text-white px-2 py-1 text-xs rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetch(
                              `http://localhost:5000/user/${item.recipient}/add-friend/${item.sender}`,
                              { method: "POST" }
                            )
                              .then((res) => {
                                if (!res.ok)
                                  throw new Error("Failed to add friend.");
                                return fetch(
                                  `http://localhost:5000/notifications/mark-as-read/${item._id}`,
                                  { method: "PATCH" }
                                );
                              })
                              .then(() =>
                                setFriendRequests((prev) =>
                                  prev.filter((r) => r._id !== item._id)
                                )
                              )
                              .catch((err) =>
                                console.error(
                                  "Failed to accept friend request",
                                  err
                                )
                              );
                          }}
                        >
                          Accept
                        </button>
                        <button
                          className="bg-gray-300 text-black px-2 py-1 text-xs rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetch(
                              `http://localhost:5000/notifications/mark-as-read/${item._id}`,
                              { method: "PATCH" }
                            )
                              .then(() =>
                                setFriendRequests((prev) =>
                                  prev.filter((r) => r._id !== item._id)
                                )
                              )
                              .catch((err) =>
                                console.error(
                                  "Failed to reject friend request",
                                  err
                                )
                              );
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-gray-500 text-center">
                    No friend requests
                  </div>
                )
              ) : null}
            </div>

            {showCommentSection && filename && (
              <CommentsModal
                isOpen={true}
                fileURL={`http://localhost:5000/uploads/${filename}`}
                previewText={selectedPreview}
                onClose={() => {
                  setShowCommentSection(false);
                  setSelectedPreview(null);
                }}
                commentReference={notifCommentId}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsModal;
