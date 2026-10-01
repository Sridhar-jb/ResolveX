const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");
const admin = require("../controllers/adminController");
const analytics = require("../controllers/analyticsController");
const categories = require("../controllers/categoryController");
const team = require("../controllers/teamController");
const audit = require("../controllers/auditController");
const settings = require("../controllers/settingController");
const chat = require("../controllers/chatController");

router.use(protect, adminOnly);

router.get("/overview", admin.overview);
router.get("/analytics", analytics.analytics);
router.get("/reports", analytics.report);
router.get("/health", settings.health);

router.get("/complaints", admin.listComplaints);
router.put("/complaints/:id/assign", admin.assign);
router.put("/complaints/:id/auto-assign", admin.autoAssign);
router.put("/complaints/:id/status", admin.updateStatus);
router.delete("/complaints/:id", admin.removeComplaint);

router.get("/users", admin.listUsers);
router.put("/users/:id", admin.updateUser);
router.delete("/users/:id", admin.removeUser);

router.get("/categories", categories.list);
router.post("/categories", categories.create);
router.put("/categories/:id", categories.update);
router.delete("/categories/:id", categories.remove);

router.get("/team", team.list);
router.post("/team", team.create);
router.put("/team/:id", team.update);
router.delete("/team/:id", team.remove);

router.get("/audit", audit.list);

router.get("/settings", settings.get);
router.put("/settings", settings.update);

router.get("/chat/conversations", chat.conversations);
router.get("/chat/customers", chat.customers);
router.get("/chat/unread-count", chat.adminUnread);
router.get("/chat/:userId", chat.thread);
router.post("/chat/:userId", chat.replyToCustomer);
router.delete("/chat/:userId/:messageId", chat.deleteAnyMessage);
router.delete("/chat/:userId", chat.deleteConversation);

module.exports = router;
