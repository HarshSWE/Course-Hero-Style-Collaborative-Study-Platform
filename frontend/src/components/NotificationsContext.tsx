import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export type NotificationType = {
  _id: string;
  recipient: string;
  file: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  preview: string;
  commentRef: string;
};

type NotificationsContextType = {
  notifications: NotificationType[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationType[]>>;
  refreshNotifications: () => Promise<void>;
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

  useEffect(() => {
    refreshNotifications();
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ notifications, setNotifications, refreshNotifications }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
