/**
 * Clean zero-dependency recursive NoSQL sanitization middleware.
 * Strips any object keys starting with '$' or containing '.' from req.body, req.query, and req.params
 * to prevent MongoDB operator injection attacks ($gt, $ne, $where, etc.).
 */
export const mongoSanitize = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = sanitize(obj[i]);
      }
      return obj;
    }

    for (const key of Object.keys(obj)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  try {
    if (req.body && typeof req.body === "object") sanitize(req.body);
    if (req.params && typeof req.params === "object") sanitize(req.params);
    if (req.query && typeof req.query === "object") sanitize(req.query);
  } catch (err) {
    console.error("mongoSanitize error:", err);
  }

  next();
};

export default mongoSanitize;
