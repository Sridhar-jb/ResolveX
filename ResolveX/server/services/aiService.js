const Complaint = require("../models/Complaint");
const Setting = require("../models/Setting");

const SYSTEM_PROMPT =
  "You are the ResolveX assistant. Answer only about the user's complaints and how ResolveX works. " +
  "Be brief, warm and practical. Never invent a status, an assignment or a policy. " +
  "If the person needs a human, point them to Customer Support.";

const summarize = (complaints) =>
  complaints.map((c) => ({
    reference: c.reference,
    title: c.title,
    category: c.category,
    priority: c.priority,
    status: c.status,
    assignedMembers: c.assignedMembers,
    createdAt: c.createdAt,
  }));

const builtInReply = (message, complaints) => {
  const text = String(message).toLowerCase();
  const latest = complaints[0];

  if (/^(hi|hello|hey|yo|good (morning|evening|afternoon))/.test(text)) {
    return "Hi. Ask me about the status of a complaint, which category to file under, or how routing works.";
  }

  if (!complaints.length) {
    return "You have not filed anything yet. Open Write a Complaint, describe what happened and where, and ResolveX routes it to the right team automatically.";
  }

  if (/pending|open|waiting/.test(text)) {
    const pending = complaints.filter((c) => c.status === "Pending");
    return pending.length
      ? `You have ${pending.length} complaint(s) still pending: ${pending.map((c) => c.title).join(", ")}.`
      : "Nothing of yours is pending. Everything you filed has been picked up.";
  }

  if (/status|where|progress|update|track/.test(text)) {
    const assignees = latest.assignedMembers?.length
      ? ` It sits with ${latest.assignedMembers.join(", ")}.`
      : " It is waiting for assignment.";
    return `Your most recent complaint, ${latest.title}, is ${latest.status}.${assignees}`;
  }

  if (/urgent|priority|escalat|important/.test(text)) {
    return "Priority is read from your description. Say what is unsafe or blocked and ResolveX raises it to High and puts three members on it.";
  }

  if (/categor|which team|route|assign/.test(text)) {
    return "Pick the closest category and ResolveX checks your wording too. Matching expertise plus current workload decides who gets it.";
  }

  if (/resolve|closed|done/.test(text)) {
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    return `${resolved} of your ${complaints.length} recent complaints are resolved. Open My Complaints to read the closing notes.`;
  }

  return "I can check the status of anything you filed, explain how priority and routing work, or help you word a new complaint. What do you need?";
};

const askAssistant = async ({ message, user }) => {
  const settings = await Setting.current();
  if (!settings.aiAssistant) {
    return { reply: "The assistant is switched off right now. Customer Support can still help.", provider: "ResolveX" };
  }

  const complaints = await Complaint.find({ user: user.id })
    .sort({ createdAt: -1 })
    .limit(8)
    .select("reference title category priority status assignedMembers createdAt")
    .lean();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { reply: builtInReply(message, complaints), provider: "ResolveX" };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Complaint history:\n${JSON.stringify(summarize(complaints))}\n\nQuestion:\n${message}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Empty response from provider");
    return { reply, provider: "OpenAI" };
  } catch (error) {
    console.error("AI provider unavailable:", error.message);
    return { reply: builtInReply(message, complaints), provider: "ResolveX" };
  }
};

// Admin-side assistant: answers from desk-wide numbers instead of one inbox.
const askAdminAssistant = async ({ message }) => {
  const text = String(message).toLowerCase();
  const [total, pending, assigned, inProgress, resolved] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: "Pending" }),
    Complaint.countDocuments({ status: "Assigned" }),
    Complaint.countDocuments({ status: "In Progress" }),
    Complaint.countDocuments({ status: "Resolved" }),
  ]);

  if (/pending|attention|unassigned/.test(text)) {
    const rows = await Complaint.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("reference title category priority")
      .lean();
    return {
      reply: rows.length
        ? `${pending} complaint(s) need attention. Oldest first: ${rows
            .map((r) => `${r.reference} ${r.title} (${r.priority})`)
            .join("; ")}.`
        : "Nothing is pending. Every complaint has an owner.",
      provider: "ResolveX",
    };
  }

  if (/category|most reported|common/.test(text)) {
    const rows = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);
    return {
      reply: rows.length
        ? `Top categories: ${rows.map((r) => `${r._id} (${r.count})`).join(", ")}.`
        : "No complaints have been filed yet.",
      provider: "ResolveX",
    };
  }

  if (/report|summary|month|overview/.test(text)) {
    return {
      reply: `Desk summary: ${total} total, ${pending} pending, ${assigned} assigned, ${inProgress} in progress, ${resolved} resolved. Reports has the full export.`,
      provider: "ResolveX",
    };
  }

  if (/resolution|suggest|how do i|advice/.test(text)) {
    return {
      reply:
        "Clear the High priority queue first, then anything pending more than 48 hours. Auto-assign handles routing; use manual assign only when you need a specific person.",
      provider: "ResolveX",
    };
  }

  return {
    reply: `Ask me about pending work, the most reported category, a monthly summary, or what to tackle next. Right now: ${total} complaints, ${pending} pending.`,
    provider: "ResolveX",
  };
};

module.exports = { askAssistant, askAdminAssistant };
