// Mongoose can surface a Buffer as a Node Buffer, a BSON Binary, or a
// serialized { type: "Buffer", data: [...] } object. Normalize all of them.
const toBuffer = (value) => {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value.buffer && Buffer.isBuffer(value.buffer)) return value.buffer;
  if (Array.isArray(value.data)) return Buffer.from(value.data);
  if (Array.isArray(value.value)) return Buffer.from(value.value);
  try {
    return Buffer.from(value);
  } catch {
    return null;
  }
};

module.exports = { toBuffer };
