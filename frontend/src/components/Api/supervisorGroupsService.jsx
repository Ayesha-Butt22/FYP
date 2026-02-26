// ==========================================
// OPTION 2: Create SEPARATE service file to avoid conflicts
// ==========================================
// File: Api/supervisorGroupsService.jsx
// This is ONLY for SupervisorGroups component

const API_BASE_URL = "http://localhost:5000/api";

const supervisorGroupsService = {
  // Get supervisor's groups with complete details
  getSupervisorGroupsWithDetails: async () => {
    const res = await fetch(`${API_BASE_URL}/supervisor/my-groups`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch groups");
    return res.json();
  }
};

export default supervisorGroupsService;