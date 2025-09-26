const API_BASE_URL = "http://localhost:5000/api";

class AdminSupervisorApi {
    async makeAPICall(endpoint, payload = {}, options = {}) {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: options.method || "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                    ...options.headers,
                },
                body: options.method === "GET" || options.method === "DELETE" ? null : JSON.stringify(payload),
                ...options,
            });

            const data = await response.json();
            return {
                success: response.ok,
                data,
                status: response.status,
                statusText: response.statusText,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null,
            };
        }
    }
    async createUser(userData) {
        return await this.makeAPICall("admin/create", userData, { method: "POST" });
    }

    async getSupervisors() {
        return await this.makeAPICall("admin/supervisors", {}, { method: "GET" });
    }

    async getCoordinators() {
        return await this.makeAPICall("admin/coordinators", {}, { method: "GET" });
    }

    async getAllUser() {
        return await  this.makeAPICall("admin/all" , {} , { method: "GET"})
    }

    async updateUser(id, updates) {
        return await this.makeAPICall(`admin/${id}`, updates, { method: "PUT" });
    }

    async deleteUser(id) {
        return await this.makeAPICall(`admin/${id}`, {}, { method: "DELETE" });
    }
}

export const adminSupervisorApi = new AdminSupervisorApi();
export default adminSupervisorApi;
