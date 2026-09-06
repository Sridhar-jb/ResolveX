const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  getAllComplaints,
  assignComplaint,
  autoAssign,
  updateStatus,
  deleteComplaint,
} = require("../controllers/adminController");

const { getDashboard } = require("../controllers/dashboardController");

const {
  getConversations,
  getCustomers,
  getConversationMessages,
  sendConversationMessage,
  getUnreadCount,
  deleteMessage,
} = require("../controllers/adminChatController");

router.get("/dashboard", protect, adminOnly, getDashboard);
router.get("/complaints", protect, adminOnly, getAllComplaints);
router.put("/assign/:id", protect, adminOnly, assignComplaint);
router.put("/auto-assign/:id", protect, adminOnly, autoAssign);
router.put("/status/:id", protect, adminOnly, updateStatus);
router.delete("/complaints/:id", protect, adminOnly, deleteComplaint);

// Customer support chat
router.get("/chat/conversations", protect, adminOnly, getConversations);
router.get("/chat/customers", protect, adminOnly, getCustomers);
router.get("/chat/unread-count", protect, adminOnly, getUnreadCount);
router.get("/chat/:userId", protect, adminOnly, getConversationMessages);
router.post("/chat/:userId", protect, adminOnly, sendConversationMessage);
router.delete("/chat/:userId/:messageId", protect, adminOnly, deleteMessage);

module.exports = router;