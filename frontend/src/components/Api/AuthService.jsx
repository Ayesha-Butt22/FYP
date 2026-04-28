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


    // Get user profile by email
async getUserByEmail(email) {
    try {
        const res = await fetch(`${API_BASE_URL}/user-by-email/${encodeURIComponent(email)}`);
        const data = await res.json();
        return { success: res.ok, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
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
        department: data.user.department || "",
        studentId: data.user?.studentId || "",
        mustChangePassword: data.user?.mustChangePassword ? 'true' : 'false',
        isGroupMade: data.user?.isGroupMade ? 'true' : 'false',
        id: data.user?.id,
        isAlsoCOR: data.user?.isAlsoCOR ? 'true' : 'false',
        IsApproved: data.user?.IsApproved ? 'true' : 'false',
        isProjectHead: data.user?.isProjectHead ? 'true' : 'false',
    };

    Object.entries(userInfo).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value);
    });

    // CHANGED: store roles array and activeRole
    const roles = data.user?.roles?.length > 0
        ? data.user.roles
        : [data.user?.role || "user"];
    localStorage.setItem("roles", JSON.stringify(roles));
    localStorage.setItem("activeRole", roles[0]);
}

    // Clear localStorage
    
clearUserData() {
    const keys = ['token', 'role', 'roles', 'activeRole', 'name', 'specialization', 'email', 'department', 'studentId', 'IsApproved', 'isProjectHead'];
    keys.forEach(key => localStorage.removeItem(key));
}

    // Get user data
   
getUserData() {
    return {
        token: localStorage.getItem('token'),
        role: localStorage.getItem('role'),
        roles: JSON.parse(localStorage.getItem('roles') || '[]'),   // CHANGED
        activeRole: localStorage.getItem('activeRole') || '',        // CHANGED
        name: localStorage.getItem('name'),
        specialization: localStorage.getItem('specialization'),
        email: localStorage.getItem('email'),
        department: localStorage.getItem('department'),
        studentId: localStorage.getItem('studentId'),
        isApproved: localStorage.getItem('IsApproved'),
        isProjectHead: localStorage.getItem('isProjectHead'),
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