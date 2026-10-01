const router = require("express").Router();
const { protect } = require("../middleware/auth");
const auth = require("../controllers/authController");

router.post("/register", auth.register);
router.post("/login", auth.login);
router.get("/me", protect, auth.me);
router.put("/profile", protect, auth.updateProfile);
router.put("/password", protect, auth.changePassword);

module.exports = router;
