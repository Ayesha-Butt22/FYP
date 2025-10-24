import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaEnvelope, FaPercentage, FaUserGraduate, FaUsers, FaTools } from "react-icons/fa";
import { Button, Chip, Box, CircularProgress } from "@mui/material";
import DashboardSectionHeader from "../Student/DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService";

// Updated supervisor data with profilePic, department, designation, specialization
const SUPERVISOR_LIST = [
  {
    supervisorId: "sup1",
    name: "Dr. Ali",
    email: "ali@university.edu",
    expertise_tags: ["AI", "Web"],
    max_limit: 5,
    current_load: 2,
    skills: ["Python", "React"],
    profilePic: "https://ui-avatars.com/api/?name=Dr.+Ali&size=128&background=2563eb&color=ffffff",
    department: "Computer Science Department",
    designation: "Associate Professor",
    specialization: "Artificial Intelligence & Web Development",
  },
  {
    supervisorId: "sup2",
    name: "Dr. Sana",
    email: "sana@university.edu",
    expertise_tags: ["ML", "Security"],
    max_limit: 3,
    current_load: 3,
    skills: ["ML", "Cybersecurity"],
    profilePic: "https://ui-avatars.com/api/?name=Dr.+Sana&size=128&background=8b5cf6&color=ffffff",
    department: "Computer Science Department",
    designation: "Assistant Professor",
    specialization: "Machine Learning & Cybersecurity",
  },
  {
    supervisorId: "sup3",
    name: "Dr. Usman",
    email: "usman@university.edu",
    expertise_tags: ["Web", "Blockchain"],
    max_limit: 4,
    current_load: 1,
    skills: ["Node.js", "Web3"],
    profilePic: "https://ui-avatars.com/api/?name=Dr.+Usman&size=128&background=10b981&color=ffffff",
    department: "Information Technology Department",
    designation: "Professor",
    specialization: "Web Technologies & Blockchain",
  },
];

// Dummy: your group's project domain(s)
const GROUP_DOMAINS = ["AI", "Web"];

export default function StudentSupervisorSelection() {
  // Simulate group status (already formed, not assigned)
  const [supervisors, setSupervisors] = useState([]);
  const [selected, setSelected] = useState(null); // id of supervisor selected/requested
  const [status, setStatus] = useState(""); // "pending" | "accepted" | "rejected"
  const [assignedSupervisor, setAssignedSupervisor] = useState(null); // if accepted
  const [loading, setLoading] = useState(false);

  // On mount: fetch supervisor list from backend (dummy here)
  useEffect(() => {
    // Simulate backend filter & ranking
    const enrich = SUPERVISOR_LIST.map((sup) => {
      const domainMatches = GROUP_DOMAINS.filter((d) =>
        sup.expertise_tags.includes(d)
      ).length;
      const domainMatchPercent = Math.round(
        (domainMatches / GROUP_DOMAINS.length) * 100
      );
      const available = sup.current_load < sup.max_limit;
      return {
        ...sup,
        domainMatchPercent,
        available,
      };
    })
      .filter((sup) => sup.available)
      .sort((a, b) =>
        b.domainMatchPercent !== a.domainMatchPercent
          ? b.domainMatchPercent - a.domainMatchPercent
          : a.current_load - b.current_load
      );
    setSupervisors(enrich);
  }, []);

  // Handler: student selects supervisor
  const handleRequestSupervisor = (supId) => {
    setLoading(true);
    setSelected(supId);
    setStatus("pending");
    toastService.info("Supervisor request sent. Waiting for response.");
    setTimeout(() => {
      if (supId === "sup1") {
        setStatus("accepted");
        setAssignedSupervisor(supervisors.find((s) => s.supervisorId === supId));
        toastService.success("Supervisor assigned successfully!");
      } else {
        setStatus("rejected");
        setAssignedSupervisor(null);
        toastService.error("Supervisor request rejected. Please select another.");
      }
      setLoading(false);
    }, 2200);
  };

  return (
    <>
      <DashboardSectionHeader>Supervisor Selection</DashboardSectionHeader>

      <div style={{ color: "#01337a", fontSize: "1rem", marginBottom: 16, marginLeft: 24, maxWidth: "800px", textAlign: "left" }}>
        Here you can view and select a supervisor for your project based on their expertise and availability.
      </div>

      <Box sx={{ width: "100%", margin: "0 auto", maxWidth: "1200px", padding: "0 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* If already assigned */}
        {status === "accepted" && assignedSupervisor && (
          <Box
            sx={{
              background: "linear-gradient(135deg, #e3fce3, #d1f5d3)",
              border: "2px solid #16a34a",
              borderRadius: "20px",
              maxWidth: "600px",
              margin: "24px auto",
              padding: "20px 24px",
              textAlign: "center",
              boxShadow: "0 6px 24px rgba(22, 163, 74, 0.15)",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#15803d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <FaCheckCircle style={{ color: "#16a34a", fontSize: 28 }} />
            Assigned Supervisor: <span style={{ color: "#1e3a8a", fontWeight: 800 }}>{assignedSupervisor.name}</span>
          </Box>
        )}

        {/* If selection pending */}
        {status === "pending" && (
          <Box
            sx={{
              background: "linear-gradient(135deg, #fef9c3, #fef08a)",
              border: "2px solid #facc15",
              borderRadius: "20px",
              maxWidth: "520px",
              margin: "24px auto",
              padding: "18px 20px",
              textAlign: "center",
              boxShadow: "0 6px 24px rgba(250, 204, 21, 0.15)",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#a16207",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <CircularProgress size={24} sx={{ color: "#a16207" }} />
            Request Pending... Awaiting Response
          </Box>
        )}

        {/* Supervisor Card Section */}
        {status !== "accepted" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              maxWidth: "800px",
              marginTop: 16,
            }}
          >
            {supervisors.length === 0 ? (
              <div style={{ fontSize: "1.1rem", color: "#475569", marginTop: 20, textAlign: "center", padding: "12px 20px", background: "#f8fafc", borderRadius: "8px" }}>
                No supervisors available for your project domains. Please contact the coordinator.
              </div>
            ) : (
              supervisors.slice(0, 1).map((sup) => (
                <div
                  key={sup.supervisorId}
                  style={{
                    width: "100%",
                    maxWidth: 720,
                    background: "linear-gradient(145deg, #ffffff, #f8fafc)",
                    border: "2px solid #2563eb33",
                    borderRadius: "20px",
                    boxShadow: "0 8px 24px rgba(37, 99, 235, 0.12)",
                    padding: "24px",
                    marginBottom: 20,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    opacity: selected && selected !== sup.supervisorId ? 0.7 : 1,
                    transition: "all 0.3s ease",
                    transform: selected && selected !== sup.supervisorId ? "scale(0.98)" : "scale(1)",
                  }}
                >
                  {/* Profile Section */}
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                    <img
                      src={sup.profilePic}
                      alt={`${sup.name}'s profile`}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "3px solid #2563eb1a",
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
                        marginRight: 20,
                      }}
                    />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 900, fontSize: 24, color: "#1e3a8a", marginBottom: 4 }}>
                        {sup.name}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#2563eb", marginBottom: 2 }}>
                        {sup.designation}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#64748b" }}>
                        {sup.department}
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "#2563eb",
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: 20,
                      padding: "8px 16px",
                      background: "#2563eb0f",
                      borderRadius: "8px",
                      border: "1px solid #2563eb1a",
                      gap: 8,
                    }}
                  >
                    <FaEnvelope style={{ fontSize: 14 }} />
                    {sup.email}
                  </div>

                  {/* Metrics Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 16,
                      marginBottom: 20,
                      width: "100%",
                      textAlign: "center",
                      padding: "0 8px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900, color: "#334155", fontSize: 18, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <FaPercentage style={{ color: "#334155", fontSize: 16 }} /> Domain Match
                      </div>
                      <div style={{ color: "#16a34a", fontWeight: 800, fontSize: 18 }}>
                        {sup.domainMatchPercent}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, color: "#334155", fontSize: 18, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <FaUserGraduate style={{ color: "#334155", fontSize: 16 }} /> Specialization
                      </div>
                      <div style={{ color: "#8b5cf6", fontWeight: 700, fontSize: 14 }}>
                        {sup.specialization}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, color: "#334155", fontSize: 18, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <FaUsers style={{ color: "#334155", fontSize: 16 }} /> Current Load
                      </div>
                      <div style={{ color: "#1e3a8a", fontWeight: 800, fontSize: 16 }}>
                        {sup.current_load}/{sup.max_limit}
                      </div>
                    </div>
                  </div>

                  {/* Availability Chip */}
                  <div style={{ marginBottom: 20 }}>
                    {sup.available ? (
                      <Chip
                        label="Available"
                        sx={{
                          bgcolor: "#e3fce3",
                          color: "#16a34a",
                          fontWeight: 700,
                          fontSize: 13,
                          padding: "4px 12px",
                          borderRadius: "8px",
                        }}
                        icon={<FaCheckCircle style={{ color: "#16a34a", fontSize: 14 }} />}
                      />
                    ) : (
                      <Chip
                        label="Not Available"
                        sx={{
                          bgcolor: "#fee2e2",
                          color: "#ef4444",
                          fontWeight: 700,
                          fontSize: 13,
                          padding: "4px 12px",
                          borderRadius: "8px",
                        }}
                        icon={<FaTimesCircle style={{ color: "#ef4444", fontSize: 14 }} />}
                      />
                    )}
                  </div>

                  {/* Expertise Tags */}
                  <div style={{ marginBottom: 20, width: "100%" }}>
                    <div
                      style={{
                        fontWeight: 900,
                        color: "#334155",
                        marginBottom: 12,
                        textAlign: "center",
                        fontSize: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <FaUserGraduate style={{ color: "#334155", fontSize: 16 }} /> Expertise Areas
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 8,
                        padding: "0 8px",
                      }}
                    >
                      {sup.expertise_tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: "#2563eb11",
                            color: "#2563eb",
                            fontWeight: 700,
                            borderRadius: "6px",
                            padding: "4px 12px",
                            fontSize: 12,
                            margin: "0 4px 8px 4px",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div style={{ marginBottom: 20, width: "100%" }}>
                    <div
                      style={{
                        fontWeight: 900,
                        color: "#334155",
                        marginBottom: 12,
                        textAlign: "center",
                        fontSize: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <FaTools style={{ color: "#334155", fontSize: 16 }} /> Key Skills
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 8,
                        padding: "0 8px",
                      }}
                    >
                      {sup.skills.map((skill, i) => (
                        <span
                          key={i}
                          style={{
                            background: "#f1f5f9",
                            color: "#1e3a8a",
                            fontWeight: 700,
                            borderRadius: "6px",
                            padding: "4px 12px",
                            fontSize: 12,
                            margin: "0 4px 8px 4px",
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Request Button */}
                  <Button
                    variant="contained"
                    color="primary"
                    size="medium"
                    fullWidth
                    disabled={
                      !sup.available ||
                      status === "pending" ||
                      (selected && selected !== sup.supervisorId) ||
                      loading
                    }
                    sx={{
                      fontWeight: 700,
                      fontSize: 16,
                      bgcolor: "linear-gradient(135deg, #1e3a8a, #2b4cb9)",
                      borderRadius: "10px",
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "linear-gradient(135deg, #2563eb, #3b82f6)",
                        boxShadow: "0 6px 20px rgba(37, 99, 235, 0.3)",
                      },
                      boxShadow: "0 4px 12px rgba(30, 58, 138, 0.15)",
                      transition: "all 0.3s ease",
                      textTransform: "none",
                    }}
                    onClick={() => handleRequestSupervisor(sup.supervisorId)}
                  >
                    {selected === sup.supervisorId && status === "pending"
                      ? "Requesting..."
                      : "Request Supervisor"}
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Rejection message */}
        {status === "rejected" && (
          <div
            style={{
              margin: "20px auto",
              color: "#b91c1c",
              fontWeight: 700,
              fontSize: "1.1rem",
              textAlign: "center",
              background: "linear-gradient(135deg, #fee2e2, #fecaca)",
              border: "2px solid #ef4444",
              borderRadius: "12px",
              padding: "16px",
              maxWidth: 480,
              boxShadow: "0 4px 16px rgba(239, 68, 68, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <FaTimesCircle style={{ color: "#ef4444", fontSize: 20 }} />
            Request Rejected. Please Try Another Supervisor.
          </div>
        )}
      </Box>
    </>
  );
}