const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      req.user = user;
      return next();
    }

    return res.status(401).json({ error: "No token provided" });
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(401).json({ error: "Token invalid or expired" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Access denied. Admin only." });
};

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === "student") {
    return next();
  }
  return res.status(403).json({ error: "Access denied. Students only." });
};

const isSupervisor = (req, res, next) => {
  if (req.user && req.user.role === "supervisor") {
    return next();
  }
  return res.status(403).json({ error: "Access denied. Supervisors only." });
};

const isCoordinator = (req, res, next) => {
  if (req.user && req.user.role === "coordinator") {
    return next();
  }
  return res.status(403).json({ error: "Access denied. Coordinators only." });
};

module.exports = { protect, isAdmin, isStudent, isSupervisor, isCoordinator };