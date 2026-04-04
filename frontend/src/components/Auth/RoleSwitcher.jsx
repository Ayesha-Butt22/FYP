// components/Auth/RoleSwitcher.jsx  (NEW FILE)
import React from "react";
import { useNavigate } from "react-router-dom";
import getUserInfoFromStorage from "./UserInfo";

const ROLE_ROUTES = {
  admin: "/dashboard/admin",
  coordinator: "/dashboard/coordinator",
  supervisor: "/dashboard/supervisor",
  student: "/dashboard/student",
};

// Drop this component anywhere in your dashboard layout/header.
// It only renders if the user has more than one role.
export default function RoleSwitcher() {
  const navigate = useNavigate();
  const { roles, activeRole } = getUserInfoFromStorage();

  // Don't render if only one role
  if (!roles || roles.length <= 1) return null;

  const handleChange = (e) => {
    const selected = e.target.value;
    localStorage.setItem("activeRole", selected);
    navigate(ROLE_ROUTES[selected] || "/auth");
  };

  return (
    <select
      value={activeRole}
      onChange={handleChange}
      style={{
        padding: "6px 12px",
        borderRadius: "6px",
        border: "1.5px solid #2563eb",
        background: "#fff",
        color: "#01337a",
        fontWeight: 600,
        fontSize: "0.95rem",
        cursor: "pointer",
      }}
      aria-label="Switch Role"
    >
      {roles.map((r) => (
        <option key={r} value={r}>
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </option>
      ))}
    </select>
  );
}