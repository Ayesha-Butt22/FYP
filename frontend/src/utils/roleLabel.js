const normalizeDepartment = (department = "") => String(department || "").trim();
const normalizeRole = (role = "") =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const formatRoleLabel = ({
  role = "",
  department = "",
  isProjectHead = false,
  isFYPHead = false,
  isFYPIncharge = false,
}) => {
  const normalizedRole = normalizeRole(role);
  const normalizedDept = normalizeDepartment(department);
  const deptUpper = normalizedDept.toUpperCase();
  const deptLower = normalizedDept.toLowerCase();

  const resolvedIsFYPHead =
    isFYPHead ||
    (isProjectHead && deptLower === "all") ||
    normalizedRole === "fyp head";

  const resolvedIsFYPIncharge =
    isFYPIncharge ||
    (isProjectHead && deptLower !== "all") ||
    normalizedRole === "fyp incharge";

  if (resolvedIsFYPHead) return "FYP Head";
  if (resolvedIsFYPIncharge) return `FYP Incharge ${deptUpper || "N/A"}`;

  return role || "User";
};

