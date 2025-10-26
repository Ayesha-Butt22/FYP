import React, { useEffect, useState } from "react";
import { FaUserTie, FaEnvelope, FaLightbulb } from "react-icons/fa";
import { Chip } from "@mui/material";
import ProfileService from "../Api/ProfileService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";

const styles = {
  container: {
    width: "100%",
  },
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
  profileCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
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
  avatarRing: {
    position: "absolute",
    width: "140px",
    height: "140px",
    border: "3px solid rgba(37, 99, 235, 0.2)",
    borderRadius: "50%",
  },
  name: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#01337a",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: "16px",
  },
  email: {
    fontSize: "15px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
    marginBottom: "24px",
  },
  expertiseSection: {
    background: "#f1f5f9",
    borderRadius: "16px",
    padding: "20px",
    width: "100%",
    marginTop: "auto",
  },
  expertiseTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  expertiseTags: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "8px",
  },
  expertiseTag: {
    background: "#2563eb",
    color: "#fff",
    fontWeight: "700",
    borderRadius: "8px",
    padding: "6px 16px",
    fontSize: "13px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "28px",
    paddingBottom: "16px",
    borderBottom: "2px solid #e2e8f0",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#01337a",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  skillsList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginBottom: "20px",
    maxHeight: "280px",
    overflowY: "auto",
    paddingRight: "8px",
  },
  skillItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  skillContent: {
    flex: "1",
  },
  skillName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#01337a",
    marginBottom: "8px",
  },
  skillBarContainer: {
    width: "100%",
    height: "12px",
    background: "#e2e8f0",
    borderRadius: "6px",
    overflow: "hidden",
    position: "relative",
  },
  skillBar: {
    height: "100%",
    borderRadius: "6px",
    transition: "width 0.6s ease",
    position: "relative",
  },
  skillPercent: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "11px",
    fontWeight: "700",
    color: "#fff",
  },
  ideasList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px",
    minHeight: "200px",
  },
  ideaItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s ease",
  },
  ideaItemHover: {
    background: "#f1f5f9",
    borderColor: "#2563eb",
  },
  ideaText: {
    flex: "1",
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
    lineHeight: "1.5",
  },
  // note: input, modal and add-button related styles are kept in the stylesheet
  // but the UI elements have been removed from the JSX per user's request.
};

export default function SupervisorProfile({ supervisorInfo }) {
  const [skills, setSkills] = useState([
    { label: "Python", color: "#2563eb", percent: 90 },
    { label: "React", color: "#f59e0b", percent: 85 },
    { label: "AI/ML", color: "#10b981", percent: 95 },
    { label: "Node.js", color: "#ef4444", percent: 70 },
  ]);
  const [profilePic, setProfilePic] = useState(null);
  const email = localStorage.getItem("email");

  useEffect(() => {
    const loadProfilePic = async () => {
      if (!email) return;
      const imageUrl = await ProfileService.getProfilePic(email);
      if (imageUrl) setProfilePic(imageUrl);
    };
    loadProfilePic();
  }, [email]);

  const expertiseTags = ["AI", "ML", "Web"];
  const [ideas] = useState([
    "AI-Based Disease Prediction",
    "Smart Attendance System",
    "Online Exam Proctoring",
  ]);

  return (
    <div>
      <DashboardSectionHeader
        description={`Here you can see your selected  supervisor  profile.`}
      >
        Selected Supervisor
      </DashboardSectionHeader>
      <div style={styles.container}>
        <div style={styles.cardsWrapper}>
          <div
            style={{
              ...styles.card,
              ...styles.profileCard,
            }}
          >
            <div style={styles.avatarContainer}>
              <div style={styles.avatarRing}></div>
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <FaUserTie size={60} color="#fff" />
              )}
            </div>
            <div style={styles.name}>{supervisorInfo?.name || "Ayesha"}</div>
            <div style={styles.subtitle}>
              {supervisorInfo?.subtitle || "AI, ML, Software Engineering"}
            </div>
            <div style={styles.email}>
              <FaEnvelope color="#2563eb" />
              {supervisorInfo?.email || "ayesha@riphah.edu.pk"}
            </div>
            <div style={styles.expertiseSection}>
              <div style={styles.expertiseTitle}>Expertise Tags</div>
              <div style={styles.expertiseTags}>
                {expertiseTags.map((tag, i) => (
                  <span key={i} style={styles.expertiseTag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ ...styles.card }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                Supervisor Skills
                <Chip
                  size="small"
                  label="Top Skills"
                  sx={{
                    background: "#dbeafe",
                    color: "#2563eb",
                    fontWeight: "700",
                    fontSize: "12px",
                    ml: 1,
                  }}
                />
              </div>
              {/* Add button removed as requested */}
            </div>

            <div style={styles.skillsList}>
              {skills.map((skill) => (
                <div key={skill.label} style={styles.skillItem}>
                  <div style={styles.skillContent}>
                    <div style={styles.skillName}>{skill.label}</div>
                    <div style={styles.skillBarContainer}>
                      <div
                        style={{
                          ...styles.skillBar,
                          width: `${skill.percent}%`,
                          background: skill.color,
                        }}
                      >
                        <span style={styles.skillPercent}>{skill.percent}%</span>
                      </div>
                    </div>
                  </div>
                  {/* skill remove button removed as requested */}
                </div>
              ))}
            </div>

            {/* help text removed as requested */}
          </div>

          <div
            style={{
              ...styles.card,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                Project Ideas <FaLightbulb color="#f59e0b" />
              </div>
            </div>

            <div style={styles.ideasList}>
              {ideas.map((idea, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.ideaItem,
                  }}
                >
                  <FaLightbulb color="#f59e0b" size={18} style={{ marginTop: "2px" }} />
                  <div style={styles.ideaText}>{idea}</div>
                  {/* idea remove button removed as requested */}
                </div>
              ))}
            </div>

            {/* input group and Add button removed as requested */}
          </div>
        </div>
      </div>
    </div>
  );
}