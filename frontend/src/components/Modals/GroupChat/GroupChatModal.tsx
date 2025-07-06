import React, { useState, useEffect } from "react";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleIcon from "@mui/icons-material/People";
import { IconButton } from "@mui/material";
import GroupChatDialog from "./GroupChatDialog";
import { useUser } from "../../ContextProviders/UserContext";
import { useProfileImage } from "../../ContextProviders/ProfileImageContext";
import socket from "../../Services/socketService";
import GroupMembers from "./GroupMembers";
import AddFriends from "./AddFriends";
import MessageInput from "./MessageInput";
import RenderMessages from "./RenderMessages";
import RenderGroupChats from "./RenderGroupChats";

type Friend = {
  _id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
};

type GroupChat = {
  _id: string;
  name: string;
  groupPictureUrl?: string;
  members: {
    _id: string;
    username: string;
    email: string;
  }[];
};

type Message = {
  _id: string;
  groupId: string;
  senderId: {
    _id: string;
    name: string;
    profilePictureUrl?: string;
  };
  content: string;
  profilePictureUrl?: string;
  createdAt: string;
  type: "text" | "system";
  files?: string[];
};

type GroupChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
};

const GroupChatModal: React.FC<GroupChatModalProps> = ({
  isOpen,
  onClose,
  setUnreadCount,
}) => {
  const { user } = useUser();
  const { image: profilePictureUrl } = useProfileImage();

  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Friend[]>([]);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [unreadChatIds, setUnreadChatIds] = useState([]);
  const [lastMessages, setLastMessages] = useState<{
    [key: string]: Message | null;
  }>({});

  // Fetch all group chats and unread chats on mount
  useEffect(() => {
    const fetchGroupChats = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/group-chats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const chats = Array.isArray(data.groupChats) ? data.groupChats : [];
      setGroupChats(chats);

      if (chats.length) {
        setSelectedChatId(chats[0]._id);
      }

      // Fetch the list of unread group chat IDs for the authenticated user from the backend
      const unreadRes = await fetch(
        "http://localhost:5000/group-chats/unread",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const unreadData = await unreadRes.json();
      setUnreadChatIds(unreadData.unreadGroupChatIds);
      setUnreadCount(unreadData.unreadGroupChatIds.length);
    };

    fetchGroupChats();
  }, []);

  // Fetch messages of selected chat and mark as read
  useEffect(() => {
    if (!selectedChatId) return;

    const fetchMessagesAndMarkAsRead = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/group-chats/${selectedChatId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);

      await fetch(`http://localhost:5000/group-chats/${selectedChatId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setUnreadChatIds((prev) => {
        const updated = prev.filter((id) => id !== selectedChatId);
        setUnreadCount(updated.length);
        return updated;
      });
    };

    fetchMessagesAndMarkAsRead();
  }, [selectedChatId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveGroupMessage = ({ message }: { message: Message }) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      setLastMessages((prev) => ({
        ...prev,
        [message.groupId]: message,
      }));
    };

    const handleMemberLeftGroup = ({ message }: { message: Message }) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    socket.on("receiveGroupMessage", handleReceiveGroupMessage);
    socket.on("memberLeftGroup", handleMemberLeftGroup);

    return () => {
      socket.off("receiveGroupMessage", handleReceiveGroupMessage);
      socket.off("memberLeftGroup", handleMemberLeftGroup);
    };
  }, [socket]);

  // Join and leave socket room based on selected group chat
  useEffect(() => {
    if (!socket || !selectedChatId) return;

    socket.emit("joinGroupChat", selectedChatId);

    return () => {
      socket.emit("leaveGroupChat", selectedChatId);
    };
  }, [socket, selectedChatId]);

  // Fetch last message preview for each chat
  useEffect(() => {
    if (!groupChats.length) return;

    const fetchLastMessages = async () => {
      const token = localStorage.getItem("token");

      // Initialize an object to store the last message for each group chat, keyed by the chat's _id
      const messagesMap: { [key: string]: Message | null } = {};

      await Promise.all(
        groupChats.map(async (chat) => {
          try {
            const res = await fetch(
              `http://localhost:5000/group-chats/${chat._id}/last-message`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const data = await res.json();
            messagesMap[chat._id] = data.lastMessage;
          } catch (err) {
            console.error(
              `Failed to fetch last message for chat ${chat._id}`,
              err
            );
            messagesMap[chat._id] = null;
          }
        })
      );

      setLastMessages(messagesMap);
    };

    fetchLastMessages();
  }, [groupChats]);

  // Socket connect/disconnect logs
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  // Send message (text + optional files)
  const handleSend = async () => {
    if ((!message.trim() && attachedFiles.length === 0) || !user?._id) return;

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("senderId", user._id);
      formData.append("content", message);
      formData.append("profilePictureUrl", profilePictureUrl || "");

      attachedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch(
        `http://localhost:5000/group-chats/${selectedChatId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const newMessage = await res.json();

      socket.emit("sendGroupMessage", {
        chatId: selectedChatId,
        message: newMessage,
      });

      setMessage("");
      setAttachedFiles([]);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Select/unselect friend when adding to group
  const handleToggleFriend = (friendId: string) => {
    // If the friend is already selected, remove them from the list
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : // If not selected, add them to the list
          [...prev, friendId]
    );
  };

  // Fetch friends eligible to be added to the current group
  const fetchFriends = async () => {
    if (!user?._id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/user/${user._id}/friends`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      // Find the currently selected group chat based on its ID
      const currentChat = groupChats.find(
        (chat) => chat._id === selectedChatId
      );

      // Extract the list of member IDs from the selected group chat, or an empty array if none
      const memberIds = currentChat?.members.map((m) => m._id) || [];

      // Filter the user's friends to only include those who are not already members of the selected group chat
      const eligibleFriends = data.friends.filter(
        (friend: Friend) => !memberIds.includes(friend._id)
      );

      setFriends(eligibleFriends);
      setShowFriendsList(true);
    } catch (err) {
      console.error("Fetch friends error:", err);
    }
  };

  const handleAddFriendsToGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `http://localhost:5000/group-chats/${selectedChatId}/add-members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userIds: selectedFriendIds }),
        }
      );

      socket.emit("membersAddedToGroup", {
        chatId: selectedChatId,
        userNames: friends
          // Filter friends list to get only those whose IDs were selected
          .filter((f) => selectedFriendIds.includes(f._id))
          // Map those friends to their names for broadcasting
          .map((f) => f.name),
      });

      // Create an array of new member objects with only necessary fields to add to the group chat's members list in local state
      const newMembers = friends
        // Get selected friends
        .filter((f) => selectedFriendIds.includes(f._id))
        .map((f) => ({
          _id: f._id,
          username: f.name,
          email: f.email,
        }));

      // Update the group chats state: add new members to the selected group chat’s members array
      setGroupChats((prevGroupChats) =>
        prevGroupChats.map((chat) =>
          chat._id === selectedChatId
            ? // Append new members
              { ...chat, members: [...chat.members, ...newMembers] }
            : // Leave other group chats unchanged
              chat
        )
      );

      // Remove newly added friends from the friends list in local state, so they no longer appear in the eligible friends list
      setFriends((prevFriends) =>
        prevFriends.filter((friend) => !selectedFriendIds.includes(friend._id))
      );

      setShowFriendsList(false);
      setSelectedFriendIds([]);
    } catch (err) {
      console.error("Add to group error:", err);
    }
  };

  const handleLeaveGroupChat = async (chatId: string) => {
    if (!user?._id) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `http://localhost:5000/group-chats/${chatId}/remove-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userIdToRemove: user._id }),
        }
      );

      if (res.ok) {
        const leaveMessage = {
          senderId: null,
          content: `${user.name || "A user"} left the chat`,
          type: "system",
        };

        await fetch(`http://localhost:5000/group-chats/${chatId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(leaveMessage),
        });

        socket.emit("memberLeftGroup", {
          chatId,
          username: user.name || "A user",
        });

        setGroupChats((prev) => prev.filter((chat) => chat._id !== chatId));
        if (selectedChatId === chatId) {
          setSelectedChatId("");
          setMessages([]);
        }
      } else {
        const data = await res.json();
        console.error("Failed to leave group:", data.message);
      }
    } catch (err) {
      console.error("Leave group error:", err);
    }
  };

  // Fetch and show group member list
  const fetchGroupMembers = async () => {
    if (!selectedChatId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/group-chats/${selectedChatId}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (Array.isArray(data.members)) {
        setGroupMembers(data.members);
        setShowGroupMembers(true);
      }
    } catch (err) {
      console.error("Error fetching group members:", err);
    }
  };

  if (!isOpen) return null;

  const selectedChat = groupChats?.find((chat) => chat._id === selectedChatId);

  return (
    <div className="fixed bottom-0 left-0 w-[700px] max-w-[calc(100vw-2rem)] h-[500px] bg-white shadow-xl border border-slate-300 flex rounded-t-xl overflow-hidden text-sm z-50">
      <RenderGroupChats
        groupChats={groupChats}
        selectedChatId={selectedChatId}
        setSelectedChatId={setSelectedChatId}
        handleLeaveGroupChat={handleLeaveGroupChat}
        setShowCreateDialog={setShowCreateDialog}
        unreadChatIds={unreadChatIds}
        lastMessages={lastMessages}
      />

      <div className="flex flex-col flex-1 bg-white">
        <div className="border-b px-4 py-3 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3 text-slate-800 font-semibold">
            <span>{showFriendsList ? "Add Friends" : selectedChat?.name}</span>
            {!showFriendsList && (
              <IconButton onClick={fetchGroupMembers}>
                <PeopleIcon fontSize="small" className="text-slate-600" />
              </IconButton>
            )}
          </div>
          <div className="flex items-center gap-1">
            {showFriendsList ? (
              <IconButton onClick={() => setShowFriendsList(false)}>
                <ArrowBackIcon />
              </IconButton>
            ) : (
              <IconButton onClick={fetchFriends}>
                <PersonAddAltIcon />
              </IconButton>
            )}

            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </div>
        </div>

        {showFriendsList ? (
          <AddFriends
            friends={friends}
            selectedFriendIds={selectedFriendIds}
            handleToggleFriend={handleToggleFriend}
            handleAddFriendsToGroup={handleAddFriendsToGroup}
          />
        ) : showGroupMembers ? (
          <GroupMembers
            groupMembers={groupMembers}
            onBack={() => setShowGroupMembers(false)}
          />
        ) : (
          <>
            <RenderMessages messages={messages} />

            <MessageInput
              message={message}
              setMessage={setMessage}
              handleSend={handleSend}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              attachedFiles={attachedFiles}
              setAttachedFiles={setAttachedFiles}
            />
          </>
        )}
      </div>

      {showCreateDialog && (
        <GroupChatDialog
          show={showCreateDialog}
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          setShowCreateDialog={setShowCreateDialog}
          setGroupChats={setGroupChats}
          setSelectedChatId={setSelectedChatId}
        />
      )}
    </div>
  );
};

export default GroupChatModal;
