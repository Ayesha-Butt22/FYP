import React, { useState, useEffect } from "react";
import { FaUserTie, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { Button, Chip, Box, CircularProgress } from "@mui/material";
import DashboardSectionHeader from "../Student/DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService";

// Dummy supervisor data for demo/testing
const SUPERVISOR_LIST = [
  {
    supervisorId: "sup1",
    name: "Dr. Ali",
    email: "ali@university.edu",
    expertise_tags: ["AI", "Web"],
    max_limit: 5,
    current_load: 2,
    skills: ["Python", "React"],
  },
  {
    supervisorId: "sup2",
    name: "Dr. Sana",
    email: "sana@university.edu",
    expertise_tags: ["ML", "Security"],
    max_limit: 3,
    current_load: 3,
    skills: ["ML", "Cybersecurity"],
  },
  {
    supervisorId: "sup3",
    name: "Dr. Usman",
    email: "usman@university.edu",
    expertise_tags: ["Web", "Blockchain"],
    max_limit: 4,
    current_load: 1,
    skills: ["Node.js", "Web3"],
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
      // Domain match: percent of group domains present in supervisor's expertise_tags
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
      // Only available supervisors
      .filter((sup) => sup.available)
      // Sort: highest domain match, then lowest load
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
    // Simulate backend response after 2.2s
    setTimeout(() => {
      // For demo, always accept first supervisor, reject others
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

      <Box sx={{ width: "100%", margin: "0 auto", maxWidth: "1100px" }}>
        <div
          style={{
            margin: "36px auto 32px auto",
            color: "#01337a",
            fontWeight: 900,
            fontSize: "2rem",
            textAlign: "center",
          }}
        >
          Select a Supervisor for your Project
        </div>

        {/* If already assigned */}
        {status === "accepted" && assignedSupervisor && (
          <Box
            sx={{
              background: "#e3fce3",
              border: "2px solid #16a34a",
              borderRadius: "16px",
              maxWidth: "580px",
              margin: "0 auto 38px auto",
              padding: "30px 22px",
              textAlign: "center",
              boxShadow: "0 2px 12px #16a34a23",
              fontSize: "1.2rem",
              fontWeight: 900,
              color: "#15803d",
            }}
          >
            <FaCheckCircle style={{ color: "#16a34a", fontSize: 28, marginBottom: -5, marginRight: 8 }} />
            Supervisor Assigned: <span style={{ color: "#01337a" }}>{assignedSupervisor.name}</span>
          </Box>
        )}

        {/* If selection pending */}
        {status === "pending" && (
          <Box
            sx={{
              background: "#fef9c3",
              border: "2px solid #facc15",
              borderRadius: "16px",
              maxWidth: "500px",
              margin: "0 auto 38px auto",
              padding: "27px 22px",
              textAlign: "center",
              boxShadow: "0 2px 12px #facc1523",
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#a16207",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <CircularProgress size={28} color="inherit" />
            Request Pending... Please wait for supervisor's response.
          </Box>
        )}

        {/* Supervisor List */}
        {status !== "accepted" && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 30,
              justifyContent: "center",
              marginTop: 22,
            }}
          >
            {supervisors.length === 0 ? (
              <div style={{ fontSize: "1.15rem", color: "#444", marginTop: 16 }}>
                No available supervisors for your project's domain(s). Contact coordinator.
              </div>
            ) : (
              supervisors.map((sup) => (
                <div
                  key={sup.supervisorId}
                  style={{
                    width: 330,
                    background: "#f8fafc",
                    border: "2.2px solid #2563eb33",
                    borderRadius: "18px",
                    boxShadow: "0 2px 12px #2563eb13",
                    padding: "32px 20px 28px 20px",
                    marginBottom: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    opacity: selected && selected !== sup.supervisorId ? 0.6 : 1,
                    transition: "opacity 0.25s",
                  }}
                >
                  <FaUserTie size={54} color="#2563eb" style={{ marginBottom: 13 }} />
                  <div style={{ fontWeight: 900, fontSize: 22, color: "#01337a", marginBottom: 2 }}>
                    {sup.name}
                  </div>
                  <div style={{ color: "#2563eb", fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
                    {sup.email}
                  </div>
                  <div style={{ marginBottom: 7, fontWeight: 700, color: "#222" }}>
                    Domain Match:{" "}
                    <span style={{ color: "#16a34a", fontWeight: 900 }}>
                      {sup.domainMatchPercent}%
                    </span>
                  </div>
                  <div style={{ marginBottom: 7, fontWeight: 700, color: "#222" }}>
                    Load:{" "}
                    <span style={{ color: "#01337a", fontWeight: 800 }}>
                      {sup.current_load}/{sup.max_limit}
                    </span>
                  </div>
                  <div style={{ marginBottom: 11 }}>
                    {sup.available ? (
                      <Chip label="Available" sx={{ bgcolor: "#e3fce3", color: "#16a34a", fontWeight: 900 }} icon={<FaCheckCircle color="#16a34a" />} />
                    ) : (
                      <Chip label="Full" sx={{ bgcolor: "#fee2e2", color: "#ef4444", fontWeight: 900 }} icon={<FaTimesCircle color="#ef4444" />} />
                    )}
                  </div>
                  <div style={{ marginBottom: 13 }}>
                    {sup.expertise_tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: "#2563eb11",
                          color: "#2563eb",
                          fontWeight: 800,
                          borderRadius: 8,
                          padding: "4px 14px",
                          fontSize: 14,
                          marginRight: 6,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                    {sup.skills.map((skill, i) => (
                      <span
                        key={i}
                        style={{
                          background: "#f1f5f9",
                          color: "#01337a",
                          fontWeight: 700,
                          borderRadius: 7,
                          padding: "3px 10px",
                          fontSize: 13,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    disabled={
                      !sup.available ||
                      status === "pending" ||
                      (selected && selected !== sup.supervisorId) ||
                      loading
                    }
                    sx={{
                      fontWeight: 900,
                      fontSize: 17,
                      bgcolor: "#01337a",
                      mt: 1,
                      borderRadius: 6,
                      py: 1.1,
                      "&:hover": { bgcolor: "#2563eb" },
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
              margin: "36px auto 0 auto",
              color: "#b91c1c",
              fontWeight: 900,
              fontSize: "1.13rem",
              textAlign: "center",
              background: "#fee2e2",
              border: "2px solid #ef4444",
              borderRadius: "14px",
              padding: "18px 15px",
              maxWidth: 500,
            }}
          >
            <FaTimesCircle style={{ color: "#ef4444", fontSize: 22, marginBottom: -4, marginRight: 6 }} />
            Supervisor request was rejected. Please select another supervisor.
          </div>
        )}
      </Box>
    </>
  );
}