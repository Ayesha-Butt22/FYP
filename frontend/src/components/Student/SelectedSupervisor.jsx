// SelectedSupervisor.jsx
import React, { useEffect, useState } from "react";
import { FaUserTie, FaEnvelope, FaLightbulb } from "react-icons/fa";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import { projectIdeasService } from "../Api/ProjectIdeasService.jsx";
import ProfileService from "../Api/ProfileService.jsx";
import axios from "axios";

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
  ideasList: { display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px", minHeight: "200px" },
  ideaItem: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", transition: "all 0.2s ease" },
  ideaText: { flex: "1", fontSize: "15px", fontWeight: "600", color: "#1e293b", lineHeight: "1.5" },
};

export default function SelectedSupervisor() {
  const [profilePic, setProfilePic] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [supervisor, setSupervisor] = useState(null);

  const email = localStorage.getItem("studentId"); // student SAP

  /* ================= LOAD IDEAS + SUPERVISOR ================= */
  useEffect(() => {
    const loadData = async () => {
      if (!email) return;

      try {
        const res = await projectIdeasService.getIdeasForStudent(email);

        if (res?.data) {
          setIdeas(res.data.ideas || []);
          setSupervisor(res.data.user || null); // 🔥 MAIN LINE
        }
      } catch (error) {
        console.error("Error loading supervisor data:", error);
        setIdeas([]);
        setSupervisor(null);
      }
    };

    loadData();
  }, [email]);

  /* ================= LOAD PROFILE PIC ================= */
  useEffect(() => {
    const loadProfilePic = async () => {
      if (!supervisor?.email) return;

      const imageUrl = await ProfileService.getProfilePic(supervisor.email);
      if (imageUrl) setProfilePic(imageUrl);
    };

    loadProfilePic();
  }, [supervisor]);

  /* ================= EXPERTISE TAGS ================= */
  const expertiseTags = supervisor?.specialization
    ? supervisor.specialization.split(",")
    : ["Web", "SE"];

  return (
    <div>
      <DashboardSectionHeader description="Here you can see your assigned supervisor profile.">
        Selected Supervisor
      </DashboardSectionHeader>

      <div style={styles.container}>
        <div style={styles.cardsWrapper}>

          {/* ================= PROFILE CARD ================= */}
          <div style={{ ...styles.card, ...styles.profileCard }}>
            <div style={styles.avatarContainer}>
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  style={styles.avatarImg}
                />
              ) : (
                <FaUserTie size={60} color="#fff" />
              )}
            </div>

            <div style={styles.name}>{supervisor?.name}</div>

            <div style={styles.subtitle}>
              {supervisor?.designation} — {supervisor?.department}
            </div>

            <div style={styles.email}>
              <FaEnvelope color="#2563eb" />
              {supervisor?.email}
            </div>

            <div style={styles.expertiseSection}>
              <div style={styles.expertiseTitle}>Expertise</div>
              <div style={styles.expertiseTags}>
                {expertiseTags.map((tag, i) => (
                  <span key={i} style={styles.expertiseTag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* ================= IDEAS CARD ================= */}
          <div style={{ ...styles.card }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                Project Ideas <FaLightbulb color="#f59e0b" />
              </div>
            </div>

            <div style={styles.ideasList}>
              {ideas.length > 0 ? (
                ideas.map((idea) => (
                  <div key={idea._id} style={styles.ideaItem}>
                    <FaLightbulb color="#f59e0b" />
                    <div>{idea.title}</div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#64748b", textAlign: "center" }}>
                  No project ideas yet.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}