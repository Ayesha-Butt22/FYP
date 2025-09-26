import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../Api/authService";
import { toastService } from "../ToastService/ToastService.jsx";
import "../../styles/AuthPortal.css";
import getUserInfoFromStorage from "./UserInfo.jsx";


export default function ChangePassword() {
    const user = getUserInfoFromStorage();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: user.email,
        oldPassword: "",
        newPassword: "",
    });
    const [showPwd, setShowPwd] = useState({
        old: false,
        new: false,
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const isStrongPassword = (password) => {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(password) && !/\s/.test(password);
    };

    const validate = (data) => {
        const errs = {};
        if (!data.oldPassword?.trim()) errs.oldPassword = "Old password is required.";
        if (!data.newPassword || data.newPassword.length < 8) {
            errs.newPassword = "New password must be at least 8 characters.";
        } else if (!isStrongPassword(data.newPassword)) {
            errs.newPassword =
                "Password must be at least 8 characters long, include uppercase, lowercase, number, special character, and no spaces.";
        }
        return errs;
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validation = validate(formData);
        setErrors(validation);
        if (Object.keys(validation).length > 0) {
            toastService.error("Please fix the errors and try again.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await authService.changePassword(formData);
            if (result.success) {
                toastService.success("Password updated successfully. Login with your new password");
                setFormData({ oldPassword: "", newPassword: "" });
                authService.logout();
                setTimeout(() => {
                    navigate("/auth");
                }, 1500);

            } else {
                const errorMessage =
                    result.data?.error || result.error || "Failed to update password.";
                toastService.error(errorMessage);
            }
        } catch (error) {
            toastService.error("Network error. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container active">
            <div className="form-box login">
                <form onSubmit={handleSubmit} noValidate>
                    <h1>Change Password</h1>
                    <div className="input-box" style={{position: "relative"}}>
                        <input
                            type={"text"}
                            required
                            value={user.email}
                            disabled={true}
                        />
                    </div>
                        <div className="input-box" style={{position: "relative"}}>
                            <input
                                type={showPwd.old ? "text" : "password"}
                                placeholder="Old Password"
                                required
                                value={formData.oldPassword}
                                onChange={(e) => handleChange("oldPassword", e.target.value)}
                                disabled={isLoading}
                            />
                            <span className="input-icon" role="img" aria-label="lock">
              🔑
            </span>
                            <button
                                type="button"
                                className="show-btn"
                                tabIndex={-1}
                                onClick={() => setShowPwd((p) => ({...p, old: !p.old}))}
                                disabled={isLoading}
                                style={{
                                    position: "absolute",
                                    right: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }}
                            >
                                {showPwd.old ? "Hide" : "Show"}
                            </button>
                        </div>
                        {errors.oldPassword && (
                            <div className="error-msg">{errors.oldPassword}</div>
                        )}


                        <div className="input-box" style={{position: "relative"}}>
                            <input
                                type={showPwd.new ? "text" : "password"}
                                placeholder="New Password"
                                required
                                value={formData.newPassword}
                                onChange={(e) => handleChange("newPassword", e.target.value)}
                                disabled={isLoading}
                            />
                            <span className="input-icon" role="img" aria-label="lock">
              🔒
            </span>
                            <button
                                type="button"
                                className="show-btn"
                                tabIndex={-1}
                                onClick={() => setShowPwd((p) => ({...p, new: !p.new}))}
                                disabled={isLoading}
                                style={{
                                    position: "absolute",
                                    right: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }}
                            >
                                {showPwd.new ? "Hide" : "Show"}
                            </button>
                        </div>
                        {errors.newPassword && (
                            <div className="error-msg">{errors.newPassword}</div>
                        )}

                        <button
                            type="submit"
                            className="btn main-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? "UPDATING..." : "UPDATE PASSWORD"}
                        </button>
                </form>
            </div>
        </div>
);
}
