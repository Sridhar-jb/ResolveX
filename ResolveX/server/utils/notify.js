const Notification = require("../models/Notification");

const notifyUser = async (userId, payload) => {
  try {
    await Notification.create({ user: userId, audience: "user", ...payload });
  } catch (error) {
    console.error("User notification failed:", error.message);
  }
};

const notifyAdmins = async (payload) => {
  try {
    await Notification.create({ user: null, audience: "admin", ...payload });
  } catch (error) {
    console.error("Admin notification failed:", error.message);
  }
};

module.exports = { notifyUser, notifyAdmins };
