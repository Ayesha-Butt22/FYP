// supervisorService.js
const API_BASE_URL = "http://localhost:5000/api";

const safeParseJSON = async (res) => {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  throw new Error(`Unexpected response from server (non-JSON). Status: ${res.status}. Content: ${text.slice(0, 100)}`);
};

const supervisorService = {
  getSupervisorGroups: async () => {
    const res = await fetch(`${API_BASE_URL}/supervisor/groups`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}` 
      }
    });
    return safeParseJSON(res);
  },
  
  updateMilestoneStatus: async (groupId, milestoneCode, data) => {
    const res = await fetch(`${API_BASE_URL}/supervisor/groups/${groupId}/milestones/${milestoneCode}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(data),
    });
    return safeParseJSON(res);
  },

  fetchGroupSubmissions: async (groupId) => {
    const res = await fetch(`${API_BASE_URL}/supervisor/group/${groupId}/submissions`);
    return safeParseJSON(res);
  },

  submitEvaluation: async (evaluationData) => {
    const res = await fetch(`${API_BASE_URL}/supervisor/evaluations/submit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(evaluationData),
    });
    return safeParseJSON(res);
  },

  fetchEvaluations: async (groupId) => {
    const res = await fetch(`${API_BASE_URL}/supervisor/evaluations/${groupId}`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });
    return safeParseJSON(res);
  },

  archiveGroup: async (mongoId) => {
    const res = await fetch(`${API_BASE_URL}/supervisor/archive-group`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ mongoId }),
    });
    return safeParseJSON(res);
  }
};

export default supervisorService;