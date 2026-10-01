const router = require("express").Router();
const { protect } = require("../middleware/auth");
const notifications = require("../controllers/notificationController");

router.use(protect);

router.get("/", notifications.list);
router.put("/read-all", notifications.markAllRead);
router.put("/:id/read", notifications.markRead);
router.delete("/:id", notifications.remove);

module.exports = router;
