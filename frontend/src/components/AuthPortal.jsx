import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/AuthPortal.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const roleFields = {
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

const registerInfo = {
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

function isValidStudentEmail(email) {
  return /^[0-9]{5}@students\.riphah\.edu\.pk$/.test(email);
}
function isValidOfficialEmail(email) {
  return /^[a-zA-Z]+@riphah\.edu\.pk$/.test(email);
}
function isValidAdminEmail(email) {
  return /^[a-zA-Z]+@riphah\.edu\.pk$/.test(email);
}
function isValidSapId(id) {
  return /^[0-9]{5}$/.test(id);
}
function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(password) && !/\s/.test(password);
}
const commonPasswords = [
  "password", "12345678", "qwerty", "abcdefgh", "student", "riphah", "admin", "letmein", "123456789", "123456"
];

export default function AuthPortal() {
  const query = useQuery();
  const navigate = useNavigate();
  const selectedRole = query.get("role");
  const [mode, setMode] = useState(selectedRole ? "register" : "login");
  const [registerData, setRegisterData] = useState({});
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedRole) setMode("register");
  }, [selectedRole]);


  const validateRegister = data => {
    let errs = {};
    const fields = roleFields[selectedRole] || [];
    for (const field of fields) {
      if (field.required && !data[field.name]) {
        errs[field.name] = `Please fill in the ${field.label}`;
      }
    }
    if (selectedRole === "student") {
      if (!isValidStudentEmail(data.email || "")) {
        errs.email = "Student email format must be 5 digits (e.g. 48288@students.riphah.edu.pk)";
      }
    } else if (selectedRole === "coordinator" || selectedRole === "supervisor") {
      if (!isValidOfficialEmail(data.email || "")) {
        errs.email = "Email format for this role must be alphabets only (e.g. hajra@riphah.edu.pk)";
      }
    } else if (selectedRole === "admin") {
      if (!isValidAdminEmail(data.email || "")) {
        errs.email = "Admin email must be alphabets only (e.g. admin@riphah.edu.pk)";
      }
    }
    if (selectedRole === "student") {
      if (!isValidSapId(data.studentId || "")) {
        errs.studentId = "Student ID (SAP ID) must be exactly 5 digits.";
      } else {
        const emailSapId = (data.email || "").split("@")[0];
        if (data.studentId !== emailSapId) {
          errs.studentId = "Student ID must match the first 5 digits of your email address.";
        }
      }
    }
    if (data.password && !isStrongPassword(data.password)) {
      errs.password = "Password must be at least 8 characters, include uppercase, lowercase, number, special character, and have no spaces.";
    }
    if (commonPasswords.includes((data.password || "").toLowerCase())) {
      errs.password = "Password is too common. Please choose a stronger password.";
    }
    if (
      selectedRole === "student" &&
      data.password &&
      (data.password.toLowerCase().includes(data.studentId) || data.password.toLowerCase().includes((data.email || "").split("@")[0]))
    ) {
      errs.password = "Password should not contain your email or ID.";
    }
    if (
      (selectedRole === "coordinator" || selectedRole === "supervisor" || selectedRole === "admin") &&
      data.password &&
      data.password.toLowerCase().includes((data.email || "").split("@")[0])
    ) {
      errs.password = "Password should not contain your email.";
    }
    if (data.password !== data.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    return errs;
  };


  const validateLogin = data => {
    let errs = {};
    if (!data.email) errs.email = "Please enter your email.";
    if (!data.password) errs.password = "Please enter your password.";

    if (selectedRole === "student" && !isValidStudentEmail(data.email || "")) {
      errs.email = "Student email format must be 5 digits (e.g. 48288@students.riphah.edu.pk)";
    }
    if (
      (selectedRole === "coordinator" || selectedRole === "supervisor" || selectedRole === "admin") &&
      !isValidOfficialEmail(data.email || "")
    ) {
      errs.email = "Email format for this role must be alphabets only (e.g. hajra@riphah.edu.pk)";
    }
    return errs;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const validation = validateLogin(loginData);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData)
      });

      const data = await res.json();

      if (res.ok) {
        // Set token and role in localStorage for protected route
        localStorage.setItem('token', data.token || "demoToken");
        localStorage.setItem('role', data.user?.role || "supervisor");
        localStorage.setItem('name', data.user?.name || "Supervisor");
        localStorage.setItem('specialization', data.user?.specialization || "");
        // Now redirect to dashboard
        navigate("/dashboard/supervisor");
      } else {
        alert("Error: " + (data.error || "Login failed"));
      }
    } catch (err) {
      alert("Network error: " + err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const validation = validateRegister(registerData);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    let payload = {};
    if (selectedRole === "student") {
      payload = {
        email: registerData.email,
        password: registerData.password,
        role: "student",
        studentId: registerData.studentId,
        department: registerData.department
      };
    } else if (selectedRole === "coordinator") {
      payload = {
        email: registerData.email,
        password: registerData.password,
        role: "coordinator",
        department: registerData.department
      };
    } else if (selectedRole === "supervisor") {
      payload = {
        email: registerData.email,
        password: registerData.password,
        role: "supervisor",
        specialization: registerData.specialization
      };
    } else if (selectedRole === "admin") {
      payload = {
        email: registerData.email,
        password: registerData.password,
        role: "admin"
      };
    } else {
      payload = {
        email: registerData.email,
        password: registerData.password
      };
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful! Please login.");
        setMode("login");
        navigate("/auth");
      } else {
        alert("Error: " + (data.error || "Registration failed"));
      }
    } catch (err) {
      alert("Network error: " + err.message);
    }
  };

  return (
    <div className={`auth-container${mode === "register" ? " active" : ""}`}>
      {/* Login Form */}
      <div className="form-box login">
        <form onSubmit={handleLogin} noValidate>
          <h1>Sign in to Portal</h1>
          <div className="input-box">
            <input
              type="email"
              placeholder="Email"
              required
              value={loginData.email}
              onChange={e => setLoginData(d => ({ ...d, email: e.target.value }))}
            />
            <span className="input-icon" role="img" aria-label="mail">📧</span>
          </div>
          {errors.email && <div className="error-msg">{errors.email}</div>}
          <div className="input-box">
            <input
              type={showPwd ? "text" : "password"}
              placeholder="Password"
              required
              value={loginData.password}
              onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))}
            />
            <span className="input-icon" role="img" aria-label="lock">🔒</span>
            <button
              type="button"
              className="show-btn"
              tabIndex={-1}
              aria-label={showPwd ? "Hide password" : "Show password"}
              onClick={() => setShowPwd(b => !b)}
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && <div className="error-msg">{errors.password}</div>}
          <button type="submit" className="btn main-btn">SIGN IN</button>
        </form>
      </div>

      <div className="form-box register">
        <div className="register-content">
          <form onSubmit={handleRegister} noValidate>
            <h1>
              Register
              {selectedRole && (
                <>
                  {" "}
                  as <span style={{ color: "#01337a" }}>{selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</span>
                </>
              )}
            </h1>
            {selectedRole && registerInfo[selectedRole]}
            {(selectedRole && roleFields[selectedRole]) ? (
              roleFields[selectedRole].map(field => (
                <div className="input-box" key={field.name}>
                  <input
                    type={
                      field.type === "password"
                        ? field.name === "password"
                          ? showPwd ? "text" : "password"
                          : showConfirmPwd ? "text" : "password"
                        : field.type
                    }
                    name={field.name}
                    placeholder={field.label}
                    required={field.required}
                    value={registerData[field.name] || ""}
                    onChange={e => setRegisterData(d => ({
                      ...d,
                      [field.name]: e.target.value
                    }))}
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      className="show-btn"
                      tabIndex={-1}
                      onClick={() =>
                        field.name === "password"
                          ? setShowPwd(b => !b)
                          : setShowConfirmPwd(b => !b)
                      }
                    >
                      {(field.name === "password" ? showPwd : showConfirmPwd) ? "Hide" : "Show"}
                    </button>
                  )}
                  {errors[field.name] && <div className="error-msg">{errors[field.name]}</div>}
                </div>
              ))
            ) : (
              <>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Username"
                    required
                    value={registerData.username || ""}
                    onChange={e => setRegisterData(d => ({ ...d, username: e.target.value }))}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={registerData.email || ""}
                    onChange={e => setRegisterData(d => ({ ...d, email: e.target.value }))}
                  />
                </div>
                <div className="input-box">
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="Password"
                    required
                    value={registerData.password || ""}
                    onChange={e => setRegisterData(d => ({ ...d, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="show-btn"
                    tabIndex={-1}
                    onClick={() => setShowPwd(b => !b)}
                  >
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>
              </>
            )}
            <button type="submit" className="btn main-btn">REGISTER</button>
          </form>
        </div>
      </div>

      <div className="toggle-box">
        <div className="toggle-panel toggle-left">
          <h1>Hello, Welcome!</h1>
          <p>Don't have an account?</p>
          <button className="btn alt-btn" onClick={() => setMode("register")}>Register</button>
        </div>
        <div className="toggle-panel toggle-right">
          <h1>Welcome Back!</h1>
          <p>Already have an account?</p>
          <button className="btn alt-btn" onClick={() => setMode("login")}>Login</button>
        </div>
      </div>
    </div>
  );
}