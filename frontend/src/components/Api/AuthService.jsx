// AuthService.jsx
const API_BASE_URL = "http://localhost:5000/api/auth";

class AuthService {

    async makeAPICall(endpoint, payload, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers
                },
                body: JSON.stringify(payload),
                ...options
            });

            const data = await response.json();

            return {
                success: response.ok,
                data,
                status: response.status,
                statusText: response.statusText
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // Login
    async login(credentials) {
        const result = await this.makeAPICall("login", credentials);

        if (result.success) {
            this.storeUserData(result.data);
        }

        return result;
    }

    // Register
    async register(userData) {
        return await this.makeAPICall("register", userData);
    }

    // Change password (old + new)
    async changePassword(payload) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: payload.oldPassword,
                    newPassword: payload.newPassword,
                })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return { success: false, error: data.error || "Something went wrong", data };
            }
        } catch (error) {
            return { success: false, error: error.message, data: null };
        }
    }
    async getUserByEmail(email) {
    try {
      const res = await fetch(`${API_BASE_URL}/user-by-email/${email}`);
      const data = await res.json();

      return {
        success: res.ok,
        data
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

    // Change password by email (no auth required)
    async changePasswordByEmail(payload) {
        return await this.makeAPICall('change-password-email', {
            email: payload.email,
            newPassword: payload.newPassword,
            confirmPassword: payload.confirmPassword
        });
    }

    // Store user data in localStorage
    storeUserData(data) {
        const userInfo = {
            token: data.token || "demoToken",
            role: data.user?.role || "user",
            name: data.user?.name || "null",
            specialization: data.user?.specialization || "",
            email: data.user?.email || "",
            department: data.user?.department || "",
            studentId: data.user?.studentId || "",
            mustChangePassword: data.user?.mustChangePassword ? 'true' : 'false',
            isGroupMade: data.user?.isGroupMade ? 'true' : 'false',
            id: data.user?.id ,
            IsApproved: data.user?.IsApproved ? 'true' : 'false',
        };

        Object.entries(userInfo).forEach(([key, value]) => {
            if (value) localStorage.setItem(key, value);
        });
    }

    // Clear localStorage
    clearUserData() {
        const keys = ['token', 'role', 'name', 'specialization', 'email', 'department', 'studentId', 'IsApproved'];
        keys.forEach(key => localStorage.removeItem(key));
    }

    // Get user data
    getUserData() {
        return {
            token: localStorage.getItem('token'),
            role: localStorage.getItem('role'),
            name: localStorage.getItem('name'),
            specialization: localStorage.getItem('specialization'),
            email: localStorage.getItem('email'),
            department: localStorage.getItem('department'),
            studentId: localStorage.getItem('studentId'),
            isApproved: localStorage.getItem('IsApproved'),
        };
    }

    // Check if logged in
    isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    // Logout
    logout() {
        this.clearUserData();
    }

    // Build register payload
    buildRegisterPayload(data, role) {
        const basePayload = {
            email: data.email,
            password: data.password,
            role: role || "user"
        };

        const roleSpecificFields = {
            student: { studentId: data.studentId, department: data.department },
            coordinator: { department: data.department },
            supervisor: { specialization: data.specialization },
            admin: {}
        };

        return { ...basePayload, ...(roleSpecificFields[role] || {}) };
    }

}

export const authService = new AuthService();
export default authService;
