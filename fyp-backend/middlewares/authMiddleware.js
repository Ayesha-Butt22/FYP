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

      // DB se user fetch (password exclude)
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

module.exports = { protect, isAdmin };
