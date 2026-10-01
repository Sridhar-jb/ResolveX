const router = require("express").Router();
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const complaints = require("../controllers/complaintController");
const categories = require("../controllers/categoryController");

router.use(protect);

router.get("/categories", categories.listActive);
router.get("/summary", complaints.mySummary);
router.post("/", upload.single("image"), complaints.create);
router.get("/", complaints.listMine);
router.get("/:id/evidence", complaints.getEvidence);
router.get("/:id", complaints.getOne);
router.put("/:id", upload.single("image"), complaints.update);
router.delete("/:id", complaints.remove);

module.exports = router;
