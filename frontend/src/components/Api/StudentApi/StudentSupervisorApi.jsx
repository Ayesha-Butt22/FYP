// StudentSupervisorApi.jsx
const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

class StudentsSupervisorApi {
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
    async getSupervisorOnSpeciality(spec) {
        const specializationParam = Array.isArray(spec) ? spec.join(",") : spec;
        return await this.makeAPICall(`/supervisors/${encodeURIComponent(specializationParam || "")}`, {}, { method: "GET" });
    }

}

export const studentsSupervisorApi = new StudentsSupervisorApi();
export default studentsSupervisorApi;