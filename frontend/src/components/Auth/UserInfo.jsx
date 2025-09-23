const getUserInfoFromStorage = () => ({
    token: localStorage.getItem("token") || "demoToken",
    role: localStorage.getItem("role") || "user",
    name: localStorage.getItem("name") || "null",
    specialization: localStorage.getItem("specialization") || "",
    email: localStorage.getItem("email") || "",
    department: localStorage.getItem("department") || "",
    studentId: localStorage.getItem("studentId") || "",
    mustChangePassword: localStorage.getItem("mustChangePassword") === "true",
});

export default getUserInfoFromStorage;
