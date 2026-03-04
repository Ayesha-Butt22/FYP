// supervisorService.js
const API_BASE_URL = "http://localhost:5000/api";

const supervisorService = {
  getSupervisorGroups: async () => {
    const res = await fetch(`${API_BASE_URL}/supervisor/groups`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}` 
      }
    });
    if (!res.ok) throw new Error("Failed to fetch groups");
    return res.json();
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
  if (!res.ok) throw new Error("Failed to update milestone");
  return res.json();
},

   fetchGroupSubmissions: async (groupId) => {
        const res = await fetch(`${API_BASE_URL}/supervisor/group/${groupId}/submissions`);
        return res.json();
    },



};

export default supervisorService;
