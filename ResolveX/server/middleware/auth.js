const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

const protect = (req, _res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Sign in to continue."));
  }

  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return next();
  } catch {
    return next(new ApiError(401, "Your session expired. Sign in again."));
  }
};

const allow = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have access to this area."));
  }
  return next();
};

const adminOnly = allow("admin");

module.exports = { protect, allow, adminOnly };
