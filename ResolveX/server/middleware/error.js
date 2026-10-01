const notFound = (_req, res) => {
  res.status(404).json({ success: false, message: "That route does not exist." });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err?.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "That image is over the 10 MB limit. Compress it and try again."
        : err.message;
    return res.status(400).json({ success: false, message });
  }

  if (err?.name === "ValidationError") {
    const message = Object.values(err.errors)[0]?.message || "Some fields need fixing.";
    return res.status(400).json({ success: false, message });
  }

  if (err?.code === 11000) {
    return res.status(409).json({ success: false, message: "That record already exists." });
  }

  if (err?.name === "CastError") {
    return res.status(400).json({ success: false, message: "That record id is not valid." });
  }

  const status = err?.status || 500;
  if (status >= 500) console.error("Server error:", err);

  res.status(status).json({
    success: false,
    message: err?.message || "Something went wrong on our side.",
  });
};

module.exports = { notFound, errorHandler };
