//api//AdminApis
const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

class AdminApis {
    async makeAPICall(endpoint, payload = {}, options = {}) {
        try {
            const token = localStorage.getItem("token");
            console.log(`Making API call to: ${API_BASE_URL}/${endpoint}`, payload);
            
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

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.warn("Non-JSON response:", text);
                data = { message: text };
            }

            console.log("API Response:", {
                endpoint,
                status: response.status,
                success: response.ok,
                data
            });

            return {
                success: response.ok,
                data,
                status: response.status,
                statusText: response.statusText,
            };
        } catch (error) {
            console.error("API Call Error:", error);
            return {
                success: false,
                error: error.message,
                data: null,
            };
        }
    }

    // ========== STUDENTS ==========
    async getStudents() {
        return await this.makeAPICall("admin/students", {}, { method: "GET" });
    }
    async approveStudent(id) {
        return await this.makeAPICall("admin/approve-students", { id }, { method: "POST" });
    }

    // ========== COORDINATOR CRUD ==========
    async createCoordinator(coordinatorData) {
        return await this.makeAPICall("admin/coordinators", coordinatorData, { method: "POST" });
    }
    
    async getCoordinators() {
        return await this.makeAPICall("admin/coordinators", {}, { method: "GET" });
    }
    
    async updateCoordinator(id, updates) {
        return await this.makeAPICall(`admin/coordinators/${id}`, updates, { method: "PUT" });
    }
    
    async deleteCoordinator(id) {
        return await this.makeAPICall(`admin/coordinators/${id}`, {}, { method: "DELETE" });
    }

    // ========== REMOVE COORDINATOR (convert to supervisor) ==========
    async removeCoordinator(id) {
        return await this.makeAPICall(`admin/coordinators/${id}/remove`, {}, { method: "PUT" });
    }

    // ========== MAKE FYP INCHARGE (COORDINATOR) ==========
    async makeFYPIncharge(id) {
        return await this.makeAPICall(`admin/coordinators/${id}/make-fyp-incharge`, {}, { method: "PUT" });
    }

    // ========== MAKE FYP HEAD (COORDINATOR) ==========
    async makeFYPHead(id) {
        return await this.makeAPICall(`admin/coordinators/${id}/make-fyp-head`, {}, { method: "PUT" });
    }

    // ========== ADMIN CRUD ==========
    async createAdmin(adminData) {
        return await this.makeAPICall("admin/create", { ...adminData, role: "admin" }, { method: "POST" });
    }
    
    async getAdmins() {
        return await this.makeAPICall("admin/alladmins", {}, { method: "GET" });
    }
    
    async updateAdmin(id, updates) {
        return await this.makeAPICall(`admin/${id}`, updates, { method: "PUT" });
    }
    
    async deleteAdmin(id) {
        return await this.makeAPICall(`admin/${id}`, {}, { method: "DELETE" });
    }

    // ========== SUPERVISOR CRUD ==========
    async createSupervisor(supervisorData) {
        return await this.makeAPICall("admin/create", { ...supervisorData, role: "supervisor" }, { method: "POST" });
    }
    
    async getSupervisors() {
        return await this.makeAPICall("admin/supervisors", {}, { method: "GET" });
    }
    
    async updateSupervisor(id, updates) {
        return await this.makeAPICall(`admin/${id}`, { ...updates, role: "supervisor" }, { method: "PUT" });
    }
    
    async deleteSupervisor(id) {
        return await this.makeAPICall(`admin/${id}`, {}, { method: "DELETE" });
    }
    
    async makeCoordinator(id) {
        return await this.makeAPICall(`admin/promote/${id}`, {}, { method: "POST" });
    }
    
    async getstats() {
        return await this.makeAPICall("admin/stats", {}, { method: "GET" });
    }
    
    async getRecentActivities() {
        return await this.makeAPICall("admin/get-activities", {}, { method: "GET" });
    }

    // ========== TOGGLE STUDENT APPROVAL ==========
    async toggleStudentApproval(id) {
        return await this.makeAPICall(`admin/toggle-approval/${id}`, {}, { method: "PATCH" });
    }

    // ========== UTILITY ==========
    async getAllUsers() {
        return await this.makeAPICall("admin/all", {}, { method: "GET" });
    }

    async getAllGroups() {
        return await this.makeAPICall("admin/all-groups", {}, { method: "GET" });
    }

    async updateSupervisorSlots(email, designation, bookedSlots) {
        return await this.makeAPICall("admin/supervisor/update-slots", { email, designation, bookedSlots }, { method: "POST" });
    }

    async getSupervisorsForCoordinator() {
        return await this.makeAPICall("admin/supervisors-for-coordinator", {}, { method: "GET" });
    }

    async uploadExcel(file) {
        const formData = new FormData();
        formData.append("file", file);
        const token = localStorage.getItem("token");
        
        try {
            const response = await fetch(`${API_BASE_URL}/admin/upload-excel`, {
                method: "POST",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: formData
            });
            
            const data = await response.json();
            return {
                success: response.ok,
                data,
                status: response.status
            };
        } catch (error) {
            console.error("Excel Upload Error:", error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }
}

export const adminSupervisorApi = new AdminApis();
export default adminSupervisorApi;