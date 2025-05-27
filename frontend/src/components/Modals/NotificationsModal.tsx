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
}) => {
  const {
    notifications,
    setNotifications,
    notificationsCount,
    setNotificationsCount,
  } = useNotifications();

  return (
    <div className="relative">
      <NotificationsIcon
        className="text-blue-500 cursor-pointer hover:scale-110 transition"
        fontSize="medium"
        onClick={() => setShowNotifications((prev) => !prev)}
      />
      {notificationsCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {notificationsCount}
        </span>
      )}

      <div className="relative">
        {showNotifications && (
          <div className="absolute top-8 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-50 overflow-y-auto max-h-96">
            {/* Tabs Header */}
            <div className="flex justify-evenly border-b border-gray-300 bg-white">
              <button
                className={`flex-1 text-center px-4 py-2 font-medium ${
                  activeTab === "insights"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : ""
                }`}
                onClick={() => setActiveTab("insights")}
              >
                Insights
              </button>
              <button
                className={`flex-1 text-center px-4 py-2 font-medium ${
                  activeTab === "notifications"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : ""
                }`}
                onClick={() => setActiveTab("notifications")}
              >
                Notifications
              </button>
            </div>

            <div className="p-2">
              {activeTab === "notifications" ? (
                notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className="px-4 py-2 border-b hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        fetch(
                          `http://localhost:5000/notifications/mark-as-read/${notif._id}`,
                          {
                            method: "PATCH",
                          }
                        )
                          .then(() => {
                            setSelectedPreview(notif.preview);
                            setNotifCommentId(notif.commentReference);
                            fetchFilename(notif.file);
                            setNotifications((prev) =>
                              prev.filter((n) => n._id !== notif._id)
                            );
                            setNotificationsCount((prev) =>
                              Math.max(prev - 1, 0)
                            );
                          })
                          .catch((err) =>
                            console.error("Failed to mark as read", err)
                          );
                      }}
                    >
                      <div className="font-medium">{notif.messageBy}</div>
                      {notif.preview && (
                        <div className="text-sm text-gray-700 italic mt-1">
                          {notif.preview}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {new Date(notif.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-gray-500 text-center">
                    No notifications
                  </div>
                )
              ) : (
                <div>
                  {insights.length > 0 ? (
                    insights.map((insight) => (
                      <div
                        key={insight._id}
                        className="px-4 py-2 border-b hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          fetch(
                            `http://localhost:5000/notifications/mark-as-read/${insight._id}`,
                            {
                              method: "PATCH",
                            }
                          )
                            .then(() => {
                              setSelectedPreview(insight.preview);
                              setNotifCommentId(insight.commentReference);
                              fetchFilename(insight.file);
                              setShowCommentSection(true);
                              setInsights((prev) =>
                                prev.filter((i) => i._id !== insight._id)
                              );
                            })
                            .catch((err) =>
                              console.error(
                                "Failed to mark insight as read",
                                err
                              )
                            );
                        }}
                      >
                        <div className="font-medium">{insight.messageBy}</div>
                        {insight.preview && (
                          <div className="text-sm text-gray-700 italic mt-1">
                            {insight.preview}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(insight.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-gray-500 text-center">
                      No insights
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comment Modal */}
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
