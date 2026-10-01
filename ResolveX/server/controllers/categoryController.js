const Category = require("../models/Category");
const Complaint = require("../models/Complaint");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { recordAudit } = require("../utils/audit");

const list = asyncHandler(async (_req, res) => {
  const [categories, usage] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Complaint.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
  ]);

  const counts = new Map(usage.map((row) => [row._id, row.count]));

  res.json({
    success: true,
    categories: categories.map((category) => ({
      ...category,
      id: category._id,
      complaints: counts.get(category.name) || 0,
    })),
  });
});

// Open endpoint used by the complaint form.
const listActive = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).select("name color description").sort({ name: 1 }).lean();
  res.json({ success: true, categories });
});

const create = asyncHandler(async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) throw new ApiError(400, "Give the category a name.");
  if (await Category.findOne({ name })) throw new ApiError(409, "That category already exists.");

  const category = await Category.create({
    name,
    description: req.body?.description || "",
    color: req.body?.color || "#6366f1",
    keywords: Array.isArray(req.body?.keywords)
      ? req.body.keywords
      : String(req.body?.keywords || "")
          .split(",")
          .map((word) => word.trim())
          .filter(Boolean),
  });

  await recordAudit(req, { action: "Category created", entity: "Category", entityId: category._id, detail: name });
  res.status(201).json({ success: true, message: `${name} added.`, category });
});

const update = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "That category does not exist.");

  const { name, description, color, isActive, keywords } = req.body || {};
  if (name) category.name = name.trim();
  if (description !== undefined) category.description = description;
  if (color) category.color = color;
  if (isActive !== undefined) category.isActive = Boolean(isActive);
  if (keywords !== undefined) {
    category.keywords = Array.isArray(keywords)
      ? keywords
      : String(keywords)
          .split(",")
          .map((word) => word.trim())
          .filter(Boolean);
  }

  await category.save();
  await recordAudit(req, { action: "Category updated", entity: "Category", entityId: category._id, detail: category.name });
  res.json({ success: true, message: "Category saved.", category });
});

const remove = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "That category does not exist.");

  const inUse = await Complaint.countDocuments({ category: category.name });
  if (inUse) {
    throw new ApiError(409, `${inUse} complaint(s) use this category. Switch it off instead of deleting it.`);
  }

  await category.deleteOne();
  await recordAudit(req, { action: "Category deleted", entity: "Category", entityId: category._id, detail: category.name });
  res.json({ success: true, message: "Category deleted." });
});

module.exports = { list, listActive, create, update, remove };
