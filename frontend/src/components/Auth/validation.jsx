
//components/Auth/validation.jsx
export const ROLE_FIELDS = {
    student: [
        { name: "email", label: "University Email", type: "email", required: true },
        { name: "password", label: "Password", type: "password", required: true },
        { name: "confirmPassword", label: "Confirm Password", type: "password", required: true },
        { name: "studentId", label: "Student ID (Sap id)", type: "text", required: true },
        { name: "department", label: "Department", type: "text", required: true }
    ],
    coordinator: [
        { name: "email", label: "Official Email", type: "email", required: true },
        { name: "password", label: "Password", type: "password", required: true },
        { name: "confirmPassword", label: "Confirm Password", type: "password", required: true },
        { name: "department", label: "Department", type: "text", required: true }
    ],
    supervisor: [
        { name: "email", label: "Official Email", type: "email", required: true },
        { name: "password", label: "Password", type: "password", required: true },
        { name: "confirmPassword", label: "Confirm Password", type: "password", required: true },
        { name: "specialization", label: "Specialization", type: "text", required: false }
    ],
    admin: [
        { name: "email", label: "Admin Email", type: "email", required: true },
        { name: "password", label: "Password", type: "password", required: true },
        { name: "confirmPassword", label: "Confirm Password", type: "password", required: true }
    ]
};

export const REGISTER_INFO = {
    student: (
        <div className="role-info-box">
            <h3>Student Registration</h3>
        </div>
    ),
    coordinator: (
        <div className="role-info-box">
            <h3>Project Coordinator Registration</h3>
        </div>
    ),
    supervisor: (
        <div className="role-info-box">
            <h3>Supervisor Registration</h3>
        </div>
    ),
    admin: (
        <div className="role-info-box">
            <h3>Admin Registration</h3>
            <ul>
                <li>Admin email must be alphabets only (e.g. <b>admin@riphah.edu.pk</b>).</li>
                <li>Password must be at least 8 characters, include uppercase, lowercase, number and special character.</li>
            </ul>
        </div>
    )
};

export const COMMON_PASSWORDS = [
    "password", "12345678", "qwerty", "abcdefgh", "student", "riphah",
    "admin", "letmein", "123456789", "123456"
];


export const isValidStudentEmail = (email) => {
    return /^[0-9]{5}@students\.riphah\.edu\.pk$/.test(email);
};

export const isValidOfficialEmail = (email) => {
    return /^[a-zA-Z]+@riphah\.edu\.pk$/.test(email);
};

export const isValidAdminEmail = (email) => {
    return /^[a-zA-Z]+@riphah\.edu\.pk$/.test(email);
};

export const isValidSapId = (id) => {
    return /^[0-9]{5}$/.test(id);
};

export const isStrongPassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(password) &&
        !/\s/.test(password);
};

export const validateRegisterField = (fieldName, value, data, selectedRole) => {
    const fields = ROLE_FIELDS[selectedRole] || [];
    const field = fields.find(f => f.name === fieldName);

    if (!field) return "";


    if (field.required && !value) {
        return `Please fill in the ${field.label}`;
    }


    if (fieldName === "email" && value) {
        if (selectedRole === "student" && !isValidStudentEmail(value)) {
            return "Student email format must be 5 digits (e.g. 48288@students.riphah.edu.pk)";
        }
        if ((selectedRole === "coordinator" || selectedRole === "supervisor") && !isValidOfficialEmail(value)) {
            return "Email format for this role must be alphabets only (e.g. hajra@riphah.edu.pk)";
        }
        if (selectedRole === "admin" && !isValidAdminEmail(value)) {
            return "Admin email must be alphabets only (e.g. admin@riphah.edu.pk)";
        }
    }


    if (fieldName === "studentId" && selectedRole === "student" && value) {
        if (!isValidSapId(value)) {
            return "Student ID (SAP ID) must be exactly 5 digits.";
        }
        const emailSapId = (data.email || "").split("@")[0];
        if (data.email && value !== emailSapId) {
            return "Student ID must match the first 5 digits of your email address.";
        }
    }


    if (fieldName === "password" && value) {
        if (!isStrongPassword(value)) {
            return "Password must be at least 8 characters, include uppercase, lowercase, number, special character, and have no spaces.";
        }
        if (COMMON_PASSWORDS.includes(value.toLowerCase())) {
            return "Password is too common. Please choose a stronger password.";
        }


        if (selectedRole === "student") {
            const studentId = data.studentId || "";
            const emailPrefix = (data.email || "").split("@")[0];
            if (value.toLowerCase().includes(studentId.toLowerCase()) ||
                value.toLowerCase().includes(emailPrefix.toLowerCase())) {
                return "Password should not contain your email or ID.";
            }
        } else if (["coordinator", "supervisor", "admin"].includes(selectedRole)) {
            const emailPrefix = (data.email || "").split("@")[0];
            if (value.toLowerCase().includes(emailPrefix.toLowerCase())) {
                return "Password should not contain your email.";
            }
        }
    }


    if (fieldName === "confirmPassword" && value && data.password) {
        if (value !== data.password) {
            return "Passwords do not match.";
        }
    }

    return "";
};

export const validateAllRegisterFields = (data, selectedRole) => {
    const errors = {};
    const fields = ROLE_FIELDS[selectedRole] || [];

    fields.forEach(field => {
        const error = validateRegisterField(field.name, data[field.name], data, selectedRole);
        if (error) {
            errors[field.name] = error;
        }
    });

    return errors;
};

export const validateLoginField = (fieldName, value, selectedRole) => {
    if (!value) {
        return fieldName === "email" ? "Please enter your email." : "Please enter your password.";
    }

    if (fieldName === "email") {
        if (selectedRole === "student" && !isValidStudentEmail(value)) {
            return "Student email format must be 5 digits (e.g. 48288@students.riphah.edu.pk)";
        }
        if (["coordinator", "supervisor", "admin"].includes(selectedRole) && !isValidOfficialEmail(value)) {
            return "Email format for this role must be alphabets only (e.g. hajra@riphah.edu.pk)";
        }
    }

    return "";
};

export const validateAllLoginFields = (data, selectedRole) => {
    const errors = {};

    ["email", "password"].forEach(field => {
        const error = validateLoginField(field, data[field], selectedRole);
        if (error) {
            errors[field] = error;
        }
    });

    return errors;
};