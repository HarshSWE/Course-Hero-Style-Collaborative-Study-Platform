import { useEffect, useRef, useState } from "react";
import FileUpload from "./FileUpload";
import Recommendations from "./Recommendations";
import SearchBar from "./SearchBar";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { useProfileImage } from "../ContextProviders/ProfileImageContext";
import { useLocation } from "react-router-dom";
import { useNotifications } from "../ContextProviders/NotificationsContext";
import { useUser } from "../ContextProviders/UserContext";
import useClickOutside from "../Hooks/useClickOutside";
import NotificationsModal from "../Modals/NotificationsModal";
import ProfileImageModal from "../Modals/ProfileImageModal";
import GroupChatModal from "../Modals/GroupChat/GroupChatModal";
import SideButtons from "./SideButtons";
import HomeFileCard from "../ContainerCards/HomeFileCard";
import TelegramIcon from "@mui/icons-material/Telegram";
import socket from "../Services/socketService";

type NotificationType = {
  _id: string;
  recipient: string;
  file: string;
  messageBy: string;
  isRead: boolean;
  createdAt: string;
  preview: string;
  commentReference: string;
};

const Home = () => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookmarkedFiles, setBookmarkedFiles] = useState<Set<string>>(
    new Set()
  );

  const [showComments, setShowComments] = useState(false);
  const [showProfilePic, setShowProfilePic] = useState(false);
  const { image } = useProfileImage();
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const [showCommentSection, setShowCommentSection] = useState<boolean>(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [notifCommentId, setNotifCommentId] = useState<string>("");
  const [folderDropdown, setFolderDropdown] = useState<boolean | null>(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const [insights, setInsights] = useState<NotificationType[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user } = useUser();

  const [selectedBookmarkFileId, setSelectedBookmarkFileId] = useState<
    string | null
  >(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { notifications, setNotifications, setNotificationsCount } =
    useNotifications();

  const { setImage } = useProfileImage();

  const { setUser } = useUser();

  // On URL change, open upload panel if upload param exists
  useEffect(() => {
    // Create a URLSearchParams object to parse the query parameters from the current URL
    const params = new URLSearchParams(location.search);

    // Check if the 'upload' query parameter is set to 'true' in the URL (e.g. ?upload=true)
    const isUploading = params.get("upload") === "true";
    setShowFileUpload(isUploading);
  }, [location]);

  // Debounced search effect on searchTerm change
  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm]);

  // Fetch bookmarked files once on mount
  useEffect(() => {
    const fetchBookmarkedFileIds = async () => {
      try {
        const res = await fetch("http://localhost:5000/bookmarks/all", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();

        const ids = data.map((file: any) => file._id);

        setBookmarkedFiles(new Set(ids));
        console.log("bookmarked files: ", bookmarkedFiles);
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
      }
    };

    fetchBookmarkedFileIds();
  }, []);

  // Socket.io listeners for real-time notifications
  useEffect(() => {
    socket.on("new-notification", () => {
      setNotificationsCount((prev) => prev + 1);
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    return () => {
      socket.off("new-notification");
      socket.off("connect");
    };
  }, []);

  // Fetch notification insights for current user
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        if (!user?._id) return;
        const res = await fetch(
          `http://localhost:5000/notifications/insights/${user._id}`
        );
        const data = await res.json();
        setInsights(data);
      } catch (err) {
        console.error("Failed to fetch insights", err);
      }
    };

    fetchInsights();
  }, [user?._id]);

  // Fetch pending friend requests
  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/notifications/friend-requests",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch friend requests");
        }

        const data = await res.json();
        setFriendRequests(data.friendRequests);
        console.log("Fetched friend requests:", data.friendRequests);
      } catch (err) {
        console.error("Error fetching friend requests:", err);
      }
    };

    fetchFriendRequests();
  }, []);

  useEffect(() => {
    fetchUnreadGroupChats();
  }, []);

  // Socket listener for new group chat messages
  useEffect(() => {
    socket.on("new-group-message", ({ chatId }) => {
      fetchUnreadGroupChats();
    });

    return () => {
      socket.off("new-group-message");
    };
  }, []);

  // Close folder dropdown when clicking outside
  useClickOutside(
    dropdownRef,
    () => {
      setFolderDropdown(null);
    },
    folderDropdown !== null
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    setImage(null);
    setNotifications([]);
    setNotificationsCount(0);
    setUser(null);
    navigate("/login");
  };

  // Toggle bookmarks for a file
  const toggleBookmark = async (fileId: string) => {
    const isBookmarked = bookmarkedFiles.has(fileId);
    const url = `http://localhost:5000/bookmarks/${fileId}`;
    const method = isBookmarked ? "DELETE" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to toggle bookmark");
      }

      const data = await res.json();

      setBookmarkedFiles((prev) => {
        const newSet = new Set(prev);
        if (isBookmarked) {
          newSet.delete(fileId);
        } else {
          newSet.add(fileId);
          setSelectedBookmarkFileId(fileId);
          setFolderDropdown(true);
        }
        return newSet;
      });
    } catch (error) {
      console.error("Bookmark toggle error:", error);
    }
  };

  // Debounced search API call
  const debouncedSearch = useRef(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:5000/file/search?q=${encodeURIComponent(term)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!res.ok) throw new Error("Search failed");

        const data = await res.json();
        setSearchResults(data);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 300)
  ).current;

  // Fetch file's filename by ID (for comment reference)
  const fetchFilename = async (fileId: string) => {
    console.log("Fetching filename for fileId:", fileId);

    try {
      const response = await fetch(
        `http://localhost:5000/file/${fileId}/filename`
      );
      if (!response.ok) {
        throw new Error("File not found");
      }
      const data = await response.json();
      console.log("Filename:", data.filename);

      setFilename(data.filename);
      setShowCommentSection(true);

      return data.filename;
    } catch (error) {
      console.error("Error fetching file:", error);
    }
  };

  // Fetch unread group chat message count
  const fetchUnreadGroupChats = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/group-chats/unread-count",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();
      setUnreadCount(data.count);
    } catch (err) {
      console.error("Error fetching unread group chats:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full bg-white shadow px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 mr-4">
          <NotificationsModal
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            insights={insights}
            setInsights={setInsights}
            fetchFilename={fetchFilename}
            setSelectedPreview={setSelectedPreview}
            setNotifCommentId={setNotifCommentId}
            showCommentSection={showCommentSection}
            setShowCommentSection={setShowCommentSection}
            selectedPreview={selectedPreview}
            filename={filename}
            notifCommentId={notifCommentId}
            friendRequests={friendRequests}
            setFriendRequests={setFriendRequests}
          />
        </div>

        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showDropdown={showDropdown}
          searchResults={searchResults}
          setSelectedFile={setSelectedFile}
          setIsModalOpen={setIsModalOpen}
          setShowDropdown={setShowDropdown}
          searchContainerRef={searchContainerRef}
        />

        <button
          onClick={() => setShowGroupChatModal(true)}
          className="relative text-blue-600 mr-8"
        >
          <TelegramIcon fontSize="medium" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        <ProfileImageModal
          image={image}
          showProfilePic={showProfilePic}
          setShowProfilePic={setShowProfilePic}
        />

        <button
          onClick={handleLogout}
          className="text-gray-700 font-semibold hover:text-red-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="flex px-8 py-6">
        <SideButtons setShowFileUpload={setShowFileUpload} />

        <div className="flex-1">
          {showFileUpload ? <FileUpload inlineMode /> : <Recommendations />}
        </div>
      </div>
      <HomeFileCard
        isOpen={isModalOpen}
        selectedFile={selectedFile}
        folderDropdown={folderDropdown}
        selectedBookmarkFileId={selectedBookmarkFileId}
        bookmarkedFiles={bookmarkedFiles}
        toggleBookmark={toggleBookmark}
        setFolderDropdown={setFolderDropdown}
        setSelectedBookmarkFileId={setSelectedBookmarkFileId}
        dropdownRef={dropdownRef}
        setShowComments={setShowComments}
        showComments={showComments}
        notifications={notifications}
        onClose={() => setIsModalOpen(false)}
      />
      {showGroupChatModal && (
        <GroupChatModal
          isOpen={showGroupChatModal}
          onClose={() => setShowGroupChatModal(false)}
          setUnreadCount={setUnreadCount}
        />
      )}
    </div>
  );
};

export default Home;
