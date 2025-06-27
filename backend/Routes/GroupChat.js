import express from "express";
import GroupChat from "../models/groupChat.model.js";
import upload from "../middleware/upload.js";
import { userModel } from "../models/user.model.js";
import { messageModel } from "../models/message.model.js";
import { authenticateUser } from "../middleware/authmiddleware.js";

const router = express.Router();

// Create a new group chat, supporting a group chat picture upload
router.post(
  "/",
  authenticateUser,
  upload.single("picture"),
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required." });
      }

      const filePath = req.file
        ? `http://localhost:5000/uploads/${req.file.filename}`
        : "";

      const newGroupChat = new GroupChat({
        name,
        groupPictureUrl: filePath,
        members: [req.user._id],
        createdAt: new Date(),
      });

      const savedGroupChat = await newGroupChat.save();

      res.status(201).json({ newGroupChat: savedGroupChat });
    } catch (error) {
      console.error("Error creating group chat:", error);
      res
        .status(500)
        .json({ message: "Server error while creating group chat." });
    }
  }
);

// Get all group chats where the authenticated user is a member, populates member info and sorts by most recently updated.
router.get("/", authenticateUser, async (req, res) => {
  try {
    const groupChats = await GroupChat.find({ members: req.user._id })
      .populate("members", "_id username email")
      .sort({ lastUpdated: -1 });

    res.json({ groupChats });
  } catch (error) {
    console.error("Error fetching group chats:", error);
    res.status(500).json({ message: "Server error fetching group chats" });
  }
});

// Add members to a group chat, validates user IDs and adds system messages announcing new members.
router.post("/:groupId/add-members", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ error: "userIds must be a non-empty array" });
    }

    // Check all userIds exist in the database
    const existingUsers = await userModel.find({ _id: { $in: userIds } });
    if (existingUsers.length !== userIds.length) {
      return res.status(400).json({ error: "Some user IDs are invalid" });
    }

    // Add users to members array without duplicates, update lastUpdated timestamp
    const updatedGroup = await GroupChat.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: { $each: userIds } }, lastUpdated: new Date() },
      { new: true }
    ).populate("members", "name email profilePictureUrl");

    if (!updatedGroup) {
      return res.status(404).json({ error: "Group chat not found" });
    }

    const systemMessages = existingUsers.map((user) => ({
      groupId,
      content: `${user.name} was added to the group.`,
      type: "system",
      createdAt: new Date(),
    }));

    await messageModel.insertMany(systemMessages);

    return res.json({
      message: "Members added successfully",
      groupChat: updatedGroup,
    });
  } catch (error) {
    console.error("Error adding members to group chat:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Retrieve all messages from a specific group chat, sorted by creation time, populates sender information.
router.get("/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await messageModel
      .find({ groupId })
      .populate("senderId", "name profilePictureUrl")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages for group chat:", error);
    res.status(500).json({ message: "Failed to fetch messages." });
  }
});

// Post a new message with text or files to a group chat while updating the group's lastUpdated timestamp and the user's last read timestamp.
router.post("/:groupId/messages", upload.array("files"), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { senderId, content, profilePictureUrl } = req.body;
    const files = req.files;

    if (!content && (!files || files.length === 0)) {
      return res.status(400).json({ message: "Content or files required." });
    }

    const fileUrls = files?.map((file) => `/uploads/${file.filename}`) || [];

    const message = new messageModel({
      groupId,
      senderId,
      content,
      profilePictureUrl,
      files: fileUrls,
      type: files.length > 0 ? "file" : "text",
    });

    await message.save();

    await GroupChat.findByIdAndUpdate(groupId, {
      lastUpdated: new Date(),
    });

    await userModel.updateOne(
      { _id: senderId, "groupChatReads.groupChatId": groupId },
      { $set: { "groupChatReads.$.lastReadAt": new Date() } }
    );

    const senderHasReadEntry = await userModel.findOne({
      _id: senderId,
      "groupChatReads.groupChatId": groupId,
    });

    if (!senderHasReadEntry) {
      await userModel.updateOne(
        { _id: senderId },
        {
          $push: {
            groupChatReads: {
              groupChatId: groupId,
              lastReadAt: new Date(),
            },
          },
        }
      );
    }

    const populatedMessage = await message.populate(
      "senderId",
      "name profilePictureUrl"
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ message: "Failed to create message." });
  }
});

router.post("/:chatId/remove-member", authenticateUser, async (req, res) => {
  const { chatId } = req.params;
  const { userIdToRemove } = req.body;

  if (!userIdToRemove) {
    return res.status(400).json({ message: "userIdToRemove is required." });
  }

  try {
    const groupChat = await GroupChat.findById(chatId);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found." });
    }

    if (!groupChat.members.includes(userIdToRemove)) {
      return res
        .status(400)
        .json({ message: "User is not a member of this group." });
    }

    groupChat.members = groupChat.members.filter(
      (memberId) => memberId.toString() !== userIdToRemove
    );

    await groupChat.save();

    res.status(200).json({
      message: "User removed from group chat.",
      updatedMembers: groupChat.members,
    });
  } catch (error) {
    console.error("Error removing user from group chat:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get members of a specific group chat, populates member details.
router.get("/:id/members", async (req, res) => {
  try {
    const groupChat = await GroupChat.findById(req.params.id)
      .populate("members", "name email profilePictureUrl")
      .exec();

    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    res.json({ members: groupChat.members });
  } catch (err) {
    console.error("Error fetching group members:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get IDs of group chats with unread messages for the authenticated user, compares last read timestamps with latest message timestamps.
router.get("/unread", authenticateUser, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);

    const groupChats = await GroupChat.find({ members: req.user._id });

    const unreadGroups = [];
    // Check each group for unread messages
    for (const group of groupChats) {
      const lastReadEntry = user.groupChatReads.find(
        (read) => read.groupChatId.toString() === group._id.toString()
      );

      const lastReadAt = lastReadEntry ? lastReadEntry.lastReadAt : new Date(0);

      const latestMessage = await messageModel
        .findOne({ groupId: group._id })
        .sort({ createdAt: -1 })
        .limit(1);

      if (latestMessage && latestMessage.createdAt > lastReadAt) {
        unreadGroups.push(group._id);
      }
    }

    res.json({ unreadGroupChatIds: unreadGroups });
  } catch (error) {
    console.error("Error fetching unread group chats:", error);
    res.status(500).json({ message: "Failed to fetch unread group chats" });
  }
});

// Mark a group chat as read for the authenticated user, updates or creates lastReadAt timestamp for the group chat.
router.post("/:groupId/read", authenticateUser, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const existingEntry = await userModel.findOne({
      _id: userId,
      "groupChatReads.groupChatId": groupId,
    });

    if (existingEntry) {
      // Update lastReadAt timestamp
      await userModel.updateOne(
        { _id: userId, "groupChatReads.groupChatId": groupId },
        { $set: { "groupChatReads.$.lastReadAt": new Date() } }
      );
    } else {
      // Create new read entry
      await userModel.updateOne(
        { _id: userId },
        {
          $push: {
            groupChatReads: {
              groupChatId: groupId,
              lastReadAt: new Date(),
            },
          },
        }
      );
    }

    res.json({ message: "Group marked as read" });
  } catch (error) {
    console.error("Error marking group as read:", error);
    res.status(500).json({ message: "Failed to mark group as read" });
  }
});

// Get count of group chats with unread messages for the authenticated user.
router.get("/unread-count", authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await userModel.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const groupChats = await GroupChat.find({
      members: userId,
    }).lean();

    let unreadCount = 0;

    // Count how many groups have newer updates than last read timestamp
    groupChats.forEach((chat) => {
      const readEntry = user.groupChatReads.find(
        (entry) => entry.groupChatId.toString() === chat._id.toString()
      );

      if (
        !readEntry ||
        new Date(chat.lastUpdated) > new Date(readEntry.lastReadAt)
      ) {
        unreadCount += 1;
      }
    });

    res.json({ count: unreadCount });
  } catch (err) {
    console.error("Failed to fetch unread group chats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get the last message sent in a specific group chat.
router.get("/:groupId/last-message", async (req, res) => {
  const { groupId } = req.params;
  const lastMessage = await messageModel
    .findOne({ groupId })
    .sort({ createdAt: -1 })
    .populate("senderId", "name profilePictureUrl");
  res.json({ lastMessage });
});

export default router;
