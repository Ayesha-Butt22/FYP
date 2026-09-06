const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/groupsinfo`;

class GroupsInfoApi {
  async fetchGroupsInfo() {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${API_BASE_URL}/info`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        console.warn("Failed to fetch /api/groups/info:", response.status);
        return { success: false, data: [] };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Error fetching groups info:", error);
      return { success: false, data: [] };
    }
  }
}

const groupsInfoApi = new GroupsInfoApi();
export default groupsInfoApi;
