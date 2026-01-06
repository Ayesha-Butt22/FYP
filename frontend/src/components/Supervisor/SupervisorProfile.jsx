import React, { useEffect, useState, useRef } from "react";
import { FaUserTie, FaEnvelope, FaLightbulb, FaTrash } from "react-icons/fa";
import { TextField, Button, IconButton } from "@mui/material";
import { authService } from "../Api/AuthService.jsx"; 
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";

const styles = {
  container: { width: "100%" },
  cardsWrapper: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
    gap: "28px",
    margin: "0 auto",
  },
  card: {
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    borderRadius: "24px",
    padding: "40px 32px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
  },
  cardHover: {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 40px rgba(37, 99, 235, 0.15)",
  },
  profileCard: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  avatarContainer: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
    boxShadow: "0 8px 24px rgba(37, 99, 235, 0.3)",
    position: "relative",
  },
  avatarRing: { position: "absolute", width: "140px", height: "140px", border: "3px solid rgba(37, 99, 235, 0.2)", borderRadius: "50%" },
  name: { fontSize: "28px", fontWeight: "900", color: "#01337a", marginBottom: "8px" },
  subtitle: { fontSize: "18px", fontWeight: "600", color: "#2563eb", marginBottom: "16px" },
  email: { fontSize: "15px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginBottom: "24px" },
  expertiseSection: { background: "#f1f5f9", borderRadius: "16px", padding: "20px", width: "100%", marginTop: "auto" },
  expertiseTitle: { fontSize: "14px", fontWeight: "700", color: "#475569", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" },
  expertiseTags: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" },
  expertiseTag: { background: "#2563eb", color: "#fff", fontWeight: "700", borderRadius: "8px", padding: "6px 16px", fontSize: "13px" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", paddingBottom: "16px", borderBottom: "2px solid #e2e8f0" },
  cardTitle: { fontSize: "24px", fontWeight: "800", color: "#01337a", display: "flex", alignItems: "center", gap: "12px" },
  passwordField: { marginBottom: "16px" },
  passwordInput: { display: "flex", alignItems: "center", gap: "8px" },
  inputGroup: { display: "flex", gap: "12px", alignItems: "center", marginTop: "auto", paddingTop: "20px", borderTop: "2px solid #e2e8f0" },
};

export default function SupervisorProfile({ supervisorInfo }) {
  const [profilePic, setProfilePic] = useState(null);
  const email = localStorage.getItem("email");
  const [hoveredCard, setHoveredCard] = useState(null);

  // Password state
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const timeoutRef = useRef(null);

  useEffect(() => {
    const loadProfilePic = async () => {
      if (!email) return;
      const imageUrl = await authService.makeAPICall('get-profile-pic', { email });
      if (imageUrl.success) setProfilePic(imageUrl.data?.url);
    };
    loadProfilePic();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }
  }, [email]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    if (message.text) {
      setMessage({ type: "", text: "" });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  const handleUpdatePassword = async () => {
    const { newPassword, confirmPassword } = passwords;

    if (!newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "All fields are required!" });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters!" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match!" });
      return;
    }

    const result = await authService.changePasswordByEmail({ email, newPassword, confirmPassword });
    console.log("API Result:", result);
    if (result.success) {
      setMessage({ type: "success", text: "✓ Password updated successfully!" });
      setPasswords({ newPassword: "", confirmPassword: "" });
    } else {
      setMessage({ type: "error", text: result.data?.error || "API failed!" });
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // Expertise & Ideas
  const expertiseTags = supervisorInfo?.expertise || ["AI", "ML", "Web"];
  const [ideas, setIdeas] = useState(supervisorInfo?.ideas || ["AI-Based Disease Prediction", "Smart Attendance System", "Online Exam Proctoring"]);
  const [newIdea, setNewIdea] = useState("");

  const handleAddIdea = () => {
    const trimmed = newIdea.trim();
    if (trimmed && !ideas.includes(trimmed)) {
      setIdeas([...ideas, trimmed]);
      setNewIdea("");
    }
  };
  const handleRemoveIdea = (idea) => setIdeas(ideas.filter((i) => i !== idea));

  return (
    <div>
      <DashboardSectionHeader description="Here you can see your profile.">Profile</DashboardSectionHeader>
      <div style={styles.container}>
        <div style={styles.cardsWrapper}>

          {/* Profile Card */}
          <div
            style={{ ...styles.card, ...styles.profileCard, ...(hoveredCard === "profile" ? styles.cardHover : {}) }}
            onMouseEnter={() => setHoveredCard("profile")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={styles.avatarContainer}>
              <div style={styles.avatarRing}></div>
              {profilePic ? <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : <FaUserTie size={60} color="#fff" />}
            </div>
            <div style={styles.name}>{supervisorInfo?.name || "Ayesha"}</div>
            <div style={styles.subtitle}>{supervisorInfo?.subtitle || "AI, ML, Software Engineering"}</div>
            <div style={styles.email}><FaEnvelope color="#2563eb" /> {supervisorInfo?.email || "ayesha@riphah.edu.pk"}</div>
            <div style={styles.expertiseSection}>
              <div style={styles.expertiseTitle}>Expertise Tags</div>
              <div style={styles.expertiseTags}>
                {expertiseTags.map((tag, i) => <span key={i} style={styles.expertiseTag}>{tag}</span>)}
              </div>
            </div>
          </div>

          {/* Update Password Card */}
          <div
            style={{ ...styles.card, ...(hoveredCard === "password" ? styles.cardHover : {}) }}
            onMouseEnter={() => setHoveredCard("password")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Update Password</div>
            </div>

            {message.text && (
              <div
                style={{
                  marginBottom: "16px",
                  color: message.type === "error" ? "#ef4444" : "#10b981",
                }}
              >
                {message.text}
              </div>
            )}

            <div style={styles.passwordField}>
              <label>New Password</label>
              <div style={styles.passwordInput}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
                <Button onClick={() => setShowNewPassword((s) => !s)}>{showNewPassword ? "Hide" : "Show"}</Button>
              </div>
            </div>

            <div style={styles.passwordField}>
              <label>Confirm Password</label>
              <div style={styles.passwordInput}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
                <Button onClick={() => setShowConfirmPassword((s) => !s)}>{showConfirmPassword ? "Hide" : "Show"}</Button>
              </div>
            </div>

            <Button
              variant="contained"
              onClick={handleUpdatePassword}
              sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: "700", textTransform: "none", borderRadius: "12px" }}
            >
              Update Password
            </Button>
          </div>

          {/* Project Ideas Card */}
          <div
            style={{ ...styles.card, display: "flex", flexDirection: "column", ...(hoveredCard === "ideas" ? styles.cardHover : {}) }}
            onMouseEnter={() => setHoveredCard("ideas")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Project Ideas</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px", minHeight: "200px" }}>
              {ideas.map((idea, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <FaLightbulb color="#f59e0b" size={18} style={{ marginTop: "2px" }} />
                  <div style={{ flex: 1, fontSize: "15px", fontWeight: "600", color: "#1e293b", lineHeight: 1.5 }}>{idea}</div>
                  <IconButton size="small" sx={{ color: "#ef4444" }} onClick={() => handleRemoveIdea(idea)}>
                    <FaTrash size={14} />
                  </IconButton>
                </div>
              ))}
            </div>
            <div style={styles.inputGroup}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Add project idea..."
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddIdea(); }}
                sx={{ bgcolor: "#f8fafc", "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
              <Button
                variant="contained"
                onClick={handleAddIdea}
                sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: "700", textTransform: "none", px: 3, borderRadius: "12px" }}
              >
                Add
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
