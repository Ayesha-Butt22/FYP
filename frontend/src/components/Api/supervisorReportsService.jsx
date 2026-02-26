// Api/supervisorReportsService.jsx
const API_BASE_URL = "http://localhost:5000/api";

const supervisorReportsService = {
  // Get supervisor's groups for reports dropdown
  getGroupsForReports: async () => {
    const res = await fetch(`${API_BASE_URL}/supervisor/reports/groups`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch groups");
    return res.json();
  },

  // Get detailed report for specific group
  getGroupReport: async (groupId) => {
    const res = await fetch(`${API_BASE_URL}/supervisor/reports/group/${groupId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch group report");
    return res.json();
  },

  // Update submission feedback/status
  updateSubmissionFeedback: async (submissionId, data) => {
    const res = await fetch(`${API_BASE_URL}/supervisor/reports/submission/${submissionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update feedback");
    return res.json();
  }
};

export default supervisorReportsService;