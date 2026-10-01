const router = require("express").Router();
const { protect } = require("../middleware/auth");
const chat = require("../controllers/chatController");

router.use(protect);

router.get("/", chat.myThread);
router.post("/", chat.sendToSupport);
router.get("/unread-count", chat.myUnread);
router.post("/ask", chat.ask);
router.delete("/", chat.clearMyThread);
router.delete("/:messageId", chat.deleteMyMessage);

module.exports = router;
