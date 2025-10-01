const API_BASE_URL = "http://localhost:5000/api/groups";

class StudentGroupApi {
    async makeAPICall(endpoint, payload = {}, options = {}) {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: options.method || "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                    ...options.headers,
                },
                body: options.method === "GET" || options.method === "DELETE" ? null : JSON.stringify(payload),
                ...options,
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async createGroup(data) {
        return await this.makeAPICall("/", data, { method: "POST" });
    }
   async getGroupByEmail(email) {
    return await this.makeAPICall(`/by-email/${encodeURIComponent(email)}`, {}, { method: "GET" });
}

    async deleteGroup(id) {
        return await this.makeAPICall(`/${id}`, {}, { method: "DELETE" });
    }
}

export const studentGroupApi = new StudentGroupApi();
export default studentGroupApi;