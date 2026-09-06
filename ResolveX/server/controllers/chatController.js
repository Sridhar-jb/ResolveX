const Message = require("../models/Message");
const { askAI } = require("../services/aiService");

// GET /api/chat  — the logged-in user's full conversation with support.
// Marks any admin messages as read by the user.
const getMyMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({ user: userId })
      .sort({ createdAt: 1 })
      .populate("sender", "name role");

    await Message.updateMany(
      { user: userId, senderRole: "admin", readByUser: false },
      { $set: { readByUser: true } }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/chat  — the logged-in user sends a message to support.
const sendMyMessage = async (req, res) => {
  try {
    const text = (req.body?.text || "").trim();
    if (!text) return res.status(400).json({ success: false, message: "Message cannot be empty" });
    if (text.length > 2000) return res.status(400).json({ success: false, message: "Message is too long" });

    const message = await Message.create({
      user: req.user.id,
      sender: req.user.id,
      senderRole: "user",
      text,
      readByUser: true,
      readByAdmin: false,
    });

    const populated = await message.populate("sender", "name role");

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/chat/unread-count — badge count of unread admin replies.
const getMyUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      user: req.user.id,
      senderRole: "admin",
      readByUser: false,
    });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// POST /api/chat/ai — AI customer support using the customer's complaint history.
const askAIController = async (req, res) => {
  try {
    const text = (req.body?.text || "").trim();
    if (!text) return res.status(400).json({ success: false, message: "Message cannot be empty" });
    if (text.length > 2000) return res.status(400).json({ success: false, message: "Message is too long" });
    const result = await askAI({ message: text, user: req.user });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("AI CHAT ERROR:", error);
    res.status(500).json({ success: false, message: "AI support is temporarily unavailable" });
  }
};

// DELETE /api/chat/:messageId — the logged-in user deletes one of their
// own messages. Users can only remove messages they themselves sent.
const deleteMyMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message || String(message.user) !== String(req.user.id)) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    if (message.senderRole !== "user" || String(message.sender) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "You can only delete your own messages" });
    }

    await message.deleteOne();
    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMyMessages, sendMyMessage, getMyUnreadCount, deleteMyMessage, askAIController };
