const router = require("express").Router();

router.use("/auth", require("./authRoutes"));
router.use("/complaints", require("./complaintRoutes"));
router.use("/notifications", require("./notificationRoutes"));
router.use("/chat", require("./chatRoutes"));
router.use("/admin", require("./adminRoutes"));

module.exports = router;
