// components/Auth/UserInfo.jsx
const getUserInfoFromStorage = () => ({
    token: localStorage.getItem("token") || "demoToken",
    role: localStorage.getItem("role") || "user",          // kept for backward compat
    roles: JSON.parse(localStorage.getItem("roles") || "[]"),  // NEW: array of roles
    activeRole: localStorage.getItem("activeRole") || "",       // NEW: currently active role
    name: localStorage.getItem("name") || "null",
    specialization: localStorage.getItem("specialization") || "",
    email: localStorage.getItem("email") || "",
    department: localStorage.getItem("department") || "",
    studentId: localStorage.getItem("studentId") || "",
    mustChangePassword: localStorage.getItem("mustChangePassword"),
    IsApproved: localStorage.getItem("IsApproved"),
});

export default getUserInfoFromStorage;