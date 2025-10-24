import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Avatar,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Modal,
} from "@mui/material";
import { FaUserTie, FaEnvelope } from "react-icons/fa";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import adminSupervisorApi from "../Api/AdminApi/AdminApis.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import "./AdminProfile.css";

/*
  AdminProfile - avatar fully inside the card and the whole card content centered.
  Avatar is placed lower inside the card and profile info + password form are centered.
*/

export default function AdminProfile() {
  // read profile info from localStorage (fallbacks)
  const fullName = localStorage.getItem("name") || "Ayesha";
  const email = localStorage.getItem("email") || "admin@riphah.edu.pk";
  const role = (localStorage.getItem("role") || "Admin").toString();
  const gender = localStorage.getItem("gender") || "Female";
  const contact =
    localStorage.getItem("phone") ||
    localStorage.getItem("contact") ||
    "0332-4423489";
  const storedPic = localStorage.getItem("profilePic") || null;

  const [profilePic, setProfilePic] = useState(storedPic);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [draft, setDraft] = useState({ name: fullName, email, gender, contact });

  useEffect(() => {
    setProfilePic(storedPic);
    setDraft({ name: fullName, email, gender, contact });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedPic]);

  const validatePassword = () => {
    const e = {};
    if (!newPassword || newPassword.trim().length === 0) {
      e.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      e.newPassword = "Password must be at least 6 characters";
    }
    if (confirmPassword !== newPassword) {
      e.confirmPassword = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const updatePassword = async (ev) => {
    ev?.preventDefault();
    if (!validatePassword()) return;
    const userId =
      localStorage.getItem("userId") ||
      localStorage.getItem("id") ||
      localStorage.getItem("_id") ||
      null;
    if (!userId) {
      toastService?.error?.("User id missing. Please re-login.");
      return;
    }

    setLoading(true);
    try {
      const payload = { password: newPassword };
      let res = null;
      if (typeof adminSupervisorApi.updateUser === "function") {
        res = await adminSupervisorApi.updateUser(userId, payload);
      } else if (typeof adminSupervisorApi.updateAdmin === "function") {
        res = await adminSupervisorApi.updateAdmin(userId, payload);
      } else {
        res = { success: false, error: "No API method available" };
      }

      if (res && res.success) {
        toastService?.success?.("Password updated successfully");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
      } else {
        const msg =
          (res && (res.error || res.data?.message)) || "Update failed";
        toastService?.error?.(msg);
      }
    } catch (err) {
      console.error(err);
      toastService?.error?.("Update failed. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Form handler wrapper (the original code referenced handleUpdatePassword)
  const handleUpdatePassword = (ev) => updatePassword(ev);

  const handleTogglePassword = () => setShowPassword((s) => !s);
  const handleToggleConfirmPassword = () =>
    setShowConfirmPassword((s) => !s);

  const openEdit = () => setShowEditModal(true);
  const closeEdit = () => {
    setShowEditModal(false);
    setDraft({ name: fullName, email, gender, contact });
  };

  const saveProfileDraft = () => {
    try {
      const updated = { ...draft };
      if (updated.name) localStorage.setItem("name", updated.name);
      if (updated.email) localStorage.setItem("email", updated.email);
      if (updated.gender) localStorage.setItem("gender", updated.gender);
      if (updated.contact) localStorage.setItem("phone", updated.contact);
      toastService?.success?.("Profile updated (local demo)");
      setShowEditModal(false);
    } catch (e) {
      toastService?.error?.("Could not save profile");
    }
  };

  return (
    <Box>
     <DashboardSectionHeader description="View and manage your profile. Update password below.">
        My Profile
      </DashboardSectionHeader>

      <Paper
        elevation={3}
        sx={{
          padding: "2rem",
          maxWidth: "500px",
          margin: "2rem auto",
          textAlign: "center",
          borderRadius: "12px",
        }}
      >
        {/* Profile Image */}
        <Avatar
          sx={{ width: 100, height: 100, margin: "0 auto 1.5rem" }}
          alt="Admin Profile"
          src={profilePic || ""} // show stored profile pic if available
        />

        {/* Profile Details - Single Column */}
        <label>
          Name: {fullName}
        </label>
<br></br>
    
              <label>
          Email: {email}
        </label>
        <br></br>
        <label>
          Role: {role}
        </label>

        <br></br>
        <label>
          Gender: {gender}
        </label>

        <br></br>
        <label>
          Contact: {contact}
        </label>
        <br>
</br>

        {/* Change Password Section */}
        <label>
          Change Password
        </label>


        <Box component="form" onSubmit={handleUpdatePassword} noValidate>
          <TextField
            label="New Password"
            variant="outlined"
            sx={{ mb: 2, width: "100%" }}
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleTogglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirm New Password"
            variant="outlined"
            sx={{ mb: 2, width: "100%" }}
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleToggleConfirmPassword}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              width: "100%",
              mt: 1,
              backgroundColor: "#01337a",
              "&:hover": { backgroundColor: "#002a61" },
            }}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </Box>
      </Paper>

      {/* Edit modal (kept minimal in case you need it later) */}
      <Modal open={showEditModal} onClose={closeEdit}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Edit Profile (local demo)
          </Typography>
          <TextField
            label="Name"
            fullWidth
            sx={{ mb: 2 }}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <TextField
            label="Email"
            fullWidth
            sx={{ mb: 2 }}
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
          />
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button onClick={saveProfileDraft} variant="contained">
              Save
            </Button>
            <Button onClick={closeEdit} variant="outlined">
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}