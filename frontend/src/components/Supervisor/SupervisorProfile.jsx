import React, { useEffect, useState, useRef } from "react";
import { FaUserTie, FaEnvelope, FaLightbulb, FaTrash } from "react-icons/fa";
import { TextField, Button, IconButton } from "@mui/material";
import { authService } from "../Api/AuthService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import { projectIdeasService } from "../Api/ProjectIdeasService.jsx";

/* ===== CSS SAME AS YOU PROVIDED (UNCHANGED) ===== */
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
/* ===== END CSS ===== */

export default function SupervisorProfile({ supervisorInfo }) {
  const email = localStorage.getItem("email");

  const [profilePic, setProfilePic] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  // 🔹 IDEAS (API BASED)
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState("");

  // 🔹 PASSWORD
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const timeoutRef = useRef(null);



  useEffect(() => {
    const url = localStorage.getItem('imageurl');
    if (!url) return;
    setProfilePic(url);
  }, [email]);


  useEffect(() => {
    if (!email) return;

    const loadIdeas = async () => {
      const res = await projectIdeasService.getIdeas(email);
      if (res.success) setIdeas(res.data);
    };

    loadIdeas();
  }, [email]);

  // 🔹 Add Idea (DB)
  const handleAddIdea = async () => {
    if (!newIdea.trim()) return;

    const res = await projectIdeasService.createIdea(email, newIdea.trim());
    if (res.success) {
      setIdeas((prev) => [res.data, ...prev]);
      setNewIdea("");
    }
  };

  // 🔹 Delete Idea (DB)
  const handleRemoveIdea = async (id) => {
    const res = await projectIdeasService.deleteIdea(id);
    if (res.success) {
      setIdeas((prev) => prev.filter((idea) => idea._id !== id));
    }
  };

  // 🔹 Password handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async () => {
    const { newPassword, confirmPassword } = passwords;

    if (!newPassword || !confirmPassword)
      return setMessage({ type: "error", text: "All fields are required!" });

    if (newPassword !== confirmPassword)
      return setMessage({ type: "error", text: "Passwords do not match!" });

    const result = await authService.changePasswordByEmail({
      email,
      newPassword,
      confirmPassword,
    });

    if (result.success) {
      setMessage({ type: "success", text: "✓ Password updated successfully!" });
      setPasswords({ newPassword: "", confirmPassword: "" });
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const expertiseTags = supervisorInfo?.expertise || ["AI", "ML", "Web"];

  return (
    <div>
      <DashboardSectionHeader description="Here you can see your profile.">
        Profile
      </DashboardSectionHeader>

      <div style={styles.container}>
        <div style={styles.cardsWrapper}>

          {/* PROFILE CARD */}
          <div
            style={{ ...styles.card, ...styles.profileCard, ...(hoveredCard === "profile" ? styles.cardHover : {}) }}
            onMouseEnter={() => setHoveredCard("profile")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={styles.avatarContainer}>
              <div style={styles.avatarRing}></div>
              {profilePic ? (
                <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
              ) : (
                <FaUserTie size={60} color="#fff" />
              )}
            </div>

            <div style={styles.name}>{supervisorInfo?.name || "Ayesha"}</div>
            <div style={styles.subtitle}>{supervisorInfo?.subtitle || "AI, ML, Software Engineering"}</div>
            <div style={styles.email}><FaEnvelope /> {email}</div>

            <div style={styles.expertiseSection}>
              <div style={styles.expertiseTitle}>Expertise Tags</div>
              <div style={styles.expertiseTags}>
                {expertiseTags.map((tag, i) => (
                  <span key={i} style={styles.expertiseTag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* PASSWORD CARD */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Update Password</div>
            </div>

            {message.text && (
              <div style={{ color: message.type === "error" ? "#ef4444" : "#10b981" }}>
                {message.text}
              </div>
            )}

            <div style={styles.passwordField}>
              <label>New Password</label>
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                style={{ width: "100%", padding: "8px" }}
              />
            </div>

            <div style={styles.passwordField}>
              <label>Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                style={{ width: "100%", padding: "8px" }}
              />
            </div>

            <Button variant="contained" onClick={handleUpdatePassword}>
              Update Password
            </Button>
          </div>

          {/* IDEAS CARD */}
          <div style={{ ...styles.card, display: "flex", flexDirection: "column" }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Project Ideas</div>
            </div>

            {ideas.map((idea) => (
              <div key={idea._id} style={{ display: "flex", gap: "12px", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "12px" }}>
                <FaLightbulb color="#f59e0b" />
                <div style={{ flex: 1 }}>{idea.title}</div>
                <IconButton onClick={() => handleRemoveIdea(idea._id)}>
                  <FaTrash size={14} />
                </IconButton>
              </div>
            ))}

            <div style={styles.inputGroup}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add project idea..."
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
              />
              <Button variant="contained" onClick={handleAddIdea}>
                Add
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
