import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";

export type NotificationType = {
  _id: string;
  recipient: string;
  file: string;
  messageBy: string;
  isRead: boolean;
  createdAt: string;
  preview: string;
  commentReference: string;
};

type NotificationsContextType = {
  notifications: NotificationType[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationType[]>>;
  refreshNotifications: () => Promise<void>;
  notificationsCount: number;
  setNotificationsCount: React.Dispatch<React.SetStateAction<number>>; // 👈 add this
  refreshNotificationsCount: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | null>(
  null
);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
};

export const NotificationsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);

  const refreshNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotifications([]);
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("Fetched notifications:", data);
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const refreshNotificationsCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotificationsCount(0);
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/notifications/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotificationsCount(data.count);
    } catch (err) {
      console.error("Error fetching notifications count:", err);
    }
  };

  useEffect(() => {
    refreshNotifications();
    refreshNotificationsCount();
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      setNotifications,
      refreshNotifications,
      notificationsCount,
      setNotificationsCount,
      refreshNotificationsCount,
    }),
    [notifications, notificationsCount]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
