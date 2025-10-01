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


    async login(credentials) {
        const result = await this.makeAPICall("login", credentials);

        if (result.success) {
            this.storeUserData(result.data);
        }

        return result;
    }


    async register(userData) {
        return await this.makeAPICall("register", userData);
    }

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
            isGroupMade: data.user?.isGroupMade ? 'true' : 'false'
        };

        Object.entries(userInfo).forEach(([key, value]) => {
            if (value) {
                localStorage.setItem(key, value);
            }
        });
    }

    clearUserData() {
        const keys = ['token', 'role', 'name', 'specialization', 'email', 'department', 'studentId'];
        keys.forEach(key => localStorage.removeItem(key));
    }

    getUserData() {
        return {
            token: localStorage.getItem('token'),
            role: localStorage.getItem('role'),
            name: localStorage.getItem('name'),
            specialization: localStorage.getItem('specialization'),
            email: localStorage.getItem('email'),
            department: localStorage.getItem('department'),
            studentId: localStorage.getItem('studentId')
        };
    }

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    async changePassword(payload) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch("http://localhost:5000/api/auth/change-password", {
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
                return {
                    success: true,
                    data
                };
            } else {
                return {
                    success: false,
                    error: data.error || "Something went wrong",
                    data
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }


    logout() {
        this.clearUserData();
    }


    buildRegisterPayload(data, role) {
        const basePayload = {
            email: data.email,
            password: data.password,
            role: role || "user"
        };

        const roleSpecificFields = {
            student: {
                studentId: data.studentId,
                department: data.department
            },
            coordinator: {
                department: data.department
            },
            supervisor: {
                specialization: data.specialization
            },
            admin: {}
        };

        return {
            ...basePayload,
            ...(roleSpecificFields[role] || {})
        };
    }
}

export const authService = new AuthService();
export default authService;