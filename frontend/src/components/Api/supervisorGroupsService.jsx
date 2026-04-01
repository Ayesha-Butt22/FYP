// supervisorGroupsService.js
const API_BASE_URL = "http://localhost:5000/api";

const safeParseJSON = async (res) => {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  throw new Error(`Unexpected response from server (non-JSON). Status: ${res.status}. Content: ${text.slice(0, 100)}`);
};

const supervisorGroupsService = {
  getSupervisorGroupsWithDetails: async () => {
    const res = await fetch(`${API_BASE_URL}/supervisor/groups`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}` 
      }
    });
    const data = await safeParseJSON(res);
    
    // Normalize data if needed
    if (data.success && data.groups) {
      data.groups = data.groups.map((g, index) => ({
        ...g,
        _id: g.groupId, // Ensuring ID consistency
        groupNo: index + 1,
        title: g.description || "Untitled Project",
        program: g.special || "N/A",
        proposalStatus: g.status || "Pending",
        progress: g.milestonesTotal > 0 ? Math.round((g.milestonesCompleted / g.milestonesTotal) * 100) : 0,
      }));
    }
    return data;
  },

  fetchGroupSubmissions: async (groupId) => {
    const res = await fetch(`${API_BASE_URL}/supervisor/group/${groupId}/submissions`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        }
    });
    return safeParseJSON(res);
  }
};

export default supervisorGroupsService;
