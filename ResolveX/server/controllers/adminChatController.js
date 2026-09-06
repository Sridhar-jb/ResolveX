const Message = require("../models/Message");
const User = require("../models/User");

// GET /api/admin/chat/conversations
// One row per customer who has messaged support, newest activity first,
// with the last message preview and how many are unread by admin.
const getConversations = async (_req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$user",
          lastText: { $first: "$text" },
          lastAt: { $first: "$createdAt" },
          lastSenderRole: { $first: "$senderRole" },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$senderRole", "user"] }, { $eq: ["$readByAdmin", false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { lastAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$customer.name",
          email: "$customer.email",
          lastText: 1,
          lastAt: 1,
          lastSenderRole: 1,
          unreadCount: 1,
        },
      },
    ]);

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/chat/customers — customers with no chat history yet,
// so an admin can start a fresh conversation.
const getCustomers = async (_req, res) => {
  try {
    const customers = await User.find({ role: "user" })
      .select("name email")
      .sort({ name: 1 });
    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/chat/:userId — full thread with one customer.
// Marks that customer's messages as read by admin.
const getConversationMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const customer = await User.findById(userId).select("name email role");
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    const messages = await Message.find({ user: userId })
      .sort({ createdAt: 1 })
      .populate("sender", "name role");

    await Message.updateMany(
      { user: userId, senderRole: "user", readByAdmin: false },
      { $set: { readByAdmin: true } }
    );

    res.json({ success: true, customer, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/chat/:userId — admin replies to a customer.
const sendConversationMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const text = (req.body?.text || "").trim();
    if (!text) return res.status(400).json({ success: false, message: "Message cannot be empty" });
    if (text.length > 2000) return res.status(400).json({ success: false, message: "Message is too long" });

    const customer = await User.findById(userId).select("_id");
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    const message = await Message.create({
      user: userId,
      sender: req.user.id,
      senderRole: "admin",
      text,
      readByUser: false,
      readByAdmin: true,
    });

    const populated = await message.populate("sender", "name role");

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/chat/unread-count — total unread across all customers,
// for the badge on the admin message icon.
const getUnreadCount = async (_req, res) => {
  try {
    const count = await Message.countDocuments({ senderRole: "user", readByAdmin: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/chat/:userId/:messageId — admin removes any message
// (from the customer or from support) within that customer's conversation.
const deleteMessage = async (req, res) => {
  try {
    const { userId, messageId } = req.params;
    const message = await Message.findOne({ _id: messageId, user: userId });
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    await message.deleteOne();
    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getConversations,
  getCustomers,
  getConversationMessages,
  sendConversationMessage,
  getUnreadCount,
  deleteMessage,
};
