const TeamMember = require("../models/TeamMember");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { recordAudit } = require("../utils/audit");
const stats = require("../services/statsService");

const list = asyncHandler(async (_req, res) => {
  const [members, workload] = await Promise.all([
    TeamMember.find().sort({ name: 1 }).lean(),
    stats.memberWorkload(),
  ]);

  const byName = new Map(workload.map((row) => [row.name, row]));

  res.json({
    success: true,
    members: members.map((member) => ({
      ...member,
      id: member._id,
      open: byName.get(member.name)?.open || 0,
      resolved: byName.get(member.name)?.resolved || 0,
      total: byName.get(member.name)?.total || 0,
    })),
  });
});

const create = asyncHandler(async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) throw new ApiError(400, "Give the member a name.");

  const member = await TeamMember.create({
    name,
    email: req.body?.email || "",
    role: req.body?.role || "Moderator",
    presence: req.body?.presence || "Online",
    capacity: Number(req.body?.capacity) || 8,
    expertise: Array.isArray(req.body?.expertise)
      ? req.body.expertise
      : String(req.body?.expertise || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
  });

  await recordAudit(req, { action: "Team member added", entity: "TeamMember", entityId: member._id, detail: name });
  res.status(201).json({ success: true, message: `${name} joined the team.`, member });
});

const update = asyncHandler(async (req, res) => {
  const member = await TeamMember.findById(req.params.id);
  if (!member) throw new ApiError(404, "That member does not exist.");

  const { name, email, role, presence, capacity, expertise, isActive } = req.body || {};
  if (name) member.name = name.trim();
  if (email !== undefined) member.email = email;
  if (role) member.role = role;
  if (presence) member.presence = presence;
  if (capacity) member.capacity = Number(capacity);
  if (isActive !== undefined) member.isActive = Boolean(isActive);
  if (expertise !== undefined) {
    member.expertise = Array.isArray(expertise)
      ? expertise
      : String(expertise)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
  }

  await member.save();
  await recordAudit(req, { action: "Team member updated", entity: "TeamMember", entityId: member._id, detail: member.name });
  res.json({ success: true, message: "Member saved.", member });
});

const remove = asyncHandler(async (req, res) => {
  const member = await TeamMember.findById(req.params.id);
  if (!member) throw new ApiError(404, "That member does not exist.");

  await member.deleteOne();
  await recordAudit(req, { action: "Team member removed", entity: "TeamMember", entityId: member._id, detail: member.name });
  res.json({ success: true, message: `${member.name} was removed.` });
});

module.exports = { list, create, update, remove };
