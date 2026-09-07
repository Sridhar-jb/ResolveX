const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { getMyMessages, sendMyMessage, getMyUnreadCount, deleteMyMessage, askAIController } = require("../controllers/chatController");

router.get("/", protect, getMyMessages);
router.post("/", protect, sendMyMessage);
router.get("/unread-count", protect, getMyUnreadCount);
router.post("/ai", protect, askAIController);
router.delete("/:messageId", protect, deleteMyMessage);

module.exports = router;
