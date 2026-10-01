const Message = require("../models/Message");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { notifyAdmins, notifyUser } = require("../utils/notify");
const { askAssistant, askAdminAssistant } = require("../services/aiService");

/* ---------------------------------- user ---------------------------------- */

const myThread = asyncHandler(async (req, res) => {
  const messages = await Message.find({ user: req.user.id }).sort({ createdAt: 1 }).lean();
  await Message.updateMany(
    { user: req.user.id, senderRole: "admin", readByUser: false },
    { $set: { readByUser: true } }
  );
  res.json({ success: true, messages });
});

const sendToSupport = asyncHandler(async (req, res) => {
  const text = (req.body?.text || "").trim();
  if (!text) throw new ApiError(400, "Type a message first.");
  if (text.length > 2000) throw new ApiError(400, "Keep messages under 2000 characters.");

  const message = await Message.create({
    user: req.user.id,
    sender: req.user.id,
    senderRole: "user",
    senderName: req.user.name || "Customer",
    text,
    readByUser: true,
  });

  await notifyAdmins({
    kind: "message",
    title: "New support message",
    body: `${req.user.name || "A customer"}: ${text.slice(0, 90)}`,
    link: "/admin/support",
  });

  res.status(201).json({ success: true, message });
});

const myUnread = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    user: req.user.id,
    senderRole: "admin",
    readByUser: false,
  });
  res.json({ success: true, count });
});

const deleteMyMessage = asyncHandler(async (req, res) => {
  const message = await Message.findOne({ _id: req.params.messageId, user: req.user.id });
  if (!message) throw new ApiError(404, "That message is gone already.");
  if (message.senderRole !== "user") throw new ApiError(403, "You can only delete your own messages.");

  await message.deleteOne();
  res.json({ success: true, message: "Message deleted." });
});

const clearMyThread = asyncHandler(async (req, res) => {
  const result = await Message.deleteMany({ user: req.user.id });
  res.json({ success: true, message: "Conversation cleared.", deletedCount: result.deletedCount || 0 });
});

const ask = asyncHandler(async (req, res) => {
  const text = (req.body?.text || "").trim();
  if (!text) throw new ApiError(400, "Ask a question first.");

  const result =
    req.user.role === "admin"
      ? await askAdminAssistant({ message: text })
      : await askAssistant({ message: text, user: req.user });

  res.json({ success: true, ...result });
});

/* ---------------------------------- admin --------------------------------- */

const conversations = asyncHandler(async (_req, res) => {
  const rows = await Message.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$user",
        lastText: { $first: "$text" },
        lastAt: { $first: "$createdAt" },
        lastSenderRole: { $first: "$senderRole" },
        unread: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$senderRole", "user"] }, { $eq: ["$readByAdmin", false] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { lastAt: -1 } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "customer" } },
    { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        name: "$customer.name",
        email: "$customer.email",
        avatarColor: "$customer.avatarColor",
        lastText: 1,
        lastAt: 1,
        lastSenderRole: 1,
        unread: 1,
      },
    },
  ]);

  res.json({ success: true, conversations: rows });
});

const customers = asyncHandler(async (_req, res) => {
  const rows = await User.find({ role: "user" }).select("name email avatarColor").sort({ name: 1 }).lean();
  res.json({ success: true, customers: rows });
});

const thread = asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.userId).select("name email avatarColor role");
  if (!customer) throw new ApiError(404, "That customer does not exist.");

  const messages = await Message.find({ user: req.params.userId }).sort({ createdAt: 1 }).lean();
  await Message.updateMany(
    { user: req.params.userId, senderRole: "user", readByAdmin: false },
    { $set: { readByAdmin: true } }
  );

  res.json({ success: true, customer, messages });
});

const replyToCustomer = asyncHandler(async (req, res) => {
  const text = (req.body?.text || "").trim();
  if (!text) throw new ApiError(400, "Type a reply first.");

  const customer = await User.findById(req.params.userId).select("_id name");
  if (!customer) throw new ApiError(404, "That customer does not exist.");

  const message = await Message.create({
    user: customer._id,
    sender: req.user.id,
    senderRole: "admin",
    senderName: req.user.name || "ResolveX Support",
    text,
    readByAdmin: true,
  });

  await notifyUser(customer._id, {
    kind: "message",
    title: "Support replied",
    body: text.slice(0, 120),
    link: "/support",
  });

  res.status(201).json({ success: true, message });
});

const adminUnread = asyncHandler(async (_req, res) => {
  const count = await Message.countDocuments({ senderRole: "user", readByAdmin: false });
  res.json({ success: true, count });
});

const deleteAnyMessage = asyncHandler(async (req, res) => {
  const message = await Message.findOne({ _id: req.params.messageId, user: req.params.userId });
  if (!message) throw new ApiError(404, "That message is gone already.");
  await message.deleteOne();
  res.json({ success: true, message: "Message deleted." });
});

const deleteConversation = asyncHandler(async (req, res) => {
  const result = await Message.deleteMany({ user: req.params.userId });
  res.json({ success: true, message: "Conversation deleted.", deletedCount: result.deletedCount || 0 });
});

module.exports = {
  myThread,
  sendToSupport,
  myUnread,
  deleteMyMessage,
  clearMyThread,
  ask,
  conversations,
  customers,
  thread,
  replyToCustomer,
  adminUnread,
  deleteAnyMessage,
  deleteConversation,
};
