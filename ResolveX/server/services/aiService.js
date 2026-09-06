const Complaint = require("../models/Complaint");

const MEMBER_EXPERTISE = {
  Infrastructure: ["Anjali Verma", "Ravi Kumar", "Sneha Reddy"],
  Hostel: ["Kiran Rao", "Sneha Reddy", "Naveen Kumar"],
  Transport: ["Naveen Kumar", "Vikram Patel", "Ravi Kumar"],
  Electricity: ["Arun Sharma", "Ravi Kumar", "Sneha Reddy"],
  Water: ["Suresh Reddy", "Ravi Kumar", "Sneha Reddy"],
  Academic: ["Priya Singh", "Kiran Rao", "Rohit Das"],
  Other: ["Rohit Das", "Vikram Patel", "Anjali Verma"],
};

const ALL_MEMBERS = [
  "Ravi Kumar", "Suresh Reddy", "Kiran Rao", "Arun Sharma", "Priya Singh",
  "Vikram Patel", "Anjali Verma", "Naveen Kumar", "Rohit Das", "Sneha Reddy",
];

function normalize(value = "") {
  return String(value).toLowerCase().trim();
}

function detectCategory(title, description, suppliedCategory) {
  const text = normalize(`${title} ${description}`);
  const rules = {
    Electricity: ["electric", "power", "current", "voltage", "light", "fan", "switch", "socket", "wire"],
    Water: ["water", "tap", "pipe", "plumbing", "leak", "washroom", "bathroom", "drain"],
    Transport: ["bus", "transport", "driver", "route", "vehicle", "shuttle", "stop"],
    Hostel: ["hostel", "room", "warden", "bed", "mess", "roommate", "accommodation"],
    Academic: ["exam", "marks", "grade", "faculty", "class", "course", "attendance", "assignment", "academic"],
    Infrastructure: ["road", "building", "ceiling", "door", "window", "furniture", "lift", "elevator", "campus"],
  };

  let best = suppliedCategory || "Other";
  let score = 0;
  for (const [category, words] of Object.entries(rules)) {
    const current = words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
    if (current > score) { score = current; best = category; }
  }
  return best;
}

function priorityFromText(title, description, suppliedPriority) {
  const text = normalize(`${title} ${description}`);
  if (/urgent|emergency|danger|unsafe|fire|shock|flood|critical|immediately/.test(text)) return "High";
  if (suppliedPriority) return suppliedPriority;
  if (/not working|broken|leak|blocked|problem|issue|failed/.test(text)) return "Medium";
  return "Low";
}

async function autoAssignComplaint({ title, description, category, priority }) {
  const aiCategory = detectCategory(title, description, category);
  const aiPriority = priorityFromText(title, description, priority);
  const pool = MEMBER_EXPERTISE[aiCategory] || MEMBER_EXPERTISE.Other;

  const workload = await Complaint.aggregate([
    { $match: { assignedMembers: { $in: pool }, status: { $nin: ["Resolved", "Rejected"] } } },
    { $unwind: "$assignedMembers" },
    { $match: { assignedMembers: { $in: pool } } },
    { $group: { _id: "$assignedMembers", count: { $sum: 1 } } },
  ]);
  const counts = new Map(workload.map((item) => [item._id, item.count]));
  const ranked = [...pool].sort((a, b) => (counts.get(a) || 0) - (counts.get(b) || 0));
  const numberOfMembers = aiPriority === "High" ? 3 : aiPriority === "Medium" ? 2 : 1;

  return {
    category: aiCategory,
    priority: aiPriority,
    assignedMembers: ranked.slice(0, numberOfMembers),
    reason: `Matched ${aiCategory} expertise and balanced the active workload.`,
  };
}

function fallbackReply(message, complaints) {
  const text = normalize(message);
  const latest = complaints[0];
  if (!latest) {
    return "Hi! I'm ResolveX AI. I can help you understand complaint categories, priorities, status updates, and how to get support. You can also submit a complaint from the dashboard.";
  }
  if (/status|where|progress|update|complaint/.test(text)) {
    return `Your latest complaint is “${latest.title}”. Its current status is ${latest.status || "Pending"}${latest.assignedMembers?.length ? ` and it is assigned to ${latest.assignedMembers.join(", ")}` : ". It is waiting for assignment."}`;
  }
  if (/urgent|priority|important|emergency/.test(text)) {
    return `For urgent issues, mark the complaint as High priority and clearly describe the impact. ResolveX automatically routes complaints to members with matching expertise.`;
  }
  if (/hello|hi|hey/.test(text)) return `Hi! I'm ResolveX AI. Tell me what you need help with, such as your complaint status, priority, or how to submit an issue.`;
  return `I can help with your ResolveX complaints. I can check your recent complaint status, explain priority, and guide you on submitting or updating an issue. If you need a human, switch to Team Support.`;
}

async function askAI({ message, user }) {
  const complaints = await Complaint.find({ user: user.id })
    .sort({ createdAt: -1 })
    .limit(8)
    .select("title description category priority status assignedMembers createdAt");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { reply: fallbackReply(message, complaints), provider: "ResolveX AI" };

  const context = complaints.map((c) => ({
    title: c.title,
    category: c.category,
    priority: c.priority,
    status: c.status,
    assignedMembers: c.assignedMembers,
    createdAt: c.createdAt,
  }));

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 350,
        messages: [
          { role: "system", content: "You are ResolveX AI customer support. Be concise, friendly and practical. Only discuss ResolveX support and the user's supplied complaint data. Never invent complaint status, assignments, policies or actions. If the user needs a human, recommend Team Support." },
          { role: "user", content: `Customer complaint context:\n${JSON.stringify(context)}\n\nCustomer question:\n${message}` },
        ],
      }),
    });
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (reply) return { reply, provider: "AI powered" };
    throw new Error("Empty AI response");
  } catch (error) {
    console.error("AI provider error:", error.message);
    return { reply: fallbackReply(message, complaints), provider: "ResolveX AI" };
  }
}

module.exports = { autoAssignComplaint, askAI, MEMBER_EXPERTISE, ALL_MEMBERS };
