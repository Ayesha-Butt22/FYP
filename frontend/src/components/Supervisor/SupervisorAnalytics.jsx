// components/SupervisorAnalytics.jsx
import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  useMediaQuery,
} from "@mui/material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./SupervisorAnalytics.css";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

const BASE_URL = "http://localhost:5000/api";

const getToken = () => {
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  if (direct) return direct;
  for (const key of ["user", "auth", "userData", "currentUser"]) {
    try {
      const obj = JSON.parse(localStorage.getItem(key) || "{}");
      const tok = obj?.token || obj?.accessToken || obj?.data?.token || obj?.user?.token;
      if (tok) return tok;
    } catch {}
  }
  return "";
};

// ─── Skeleton ─────────────────────────────────
function Skeleton({ height = 18, width = "100%", radius = 8 }) {
  return (
    <div style={{
      height, width, borderRadius: radius, marginBottom: 10,
      background: "linear-gradient(90deg,#e0e7ef 25%,#f0f4fa 50%,#e0e7ef 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// All possible template codes in order
const ALL_TEMPLATES = ["t01","t02","t03","t04","t05","t06","t07","t08","t09"];

// Color palette for groups
const GROUP_COLORS = [
  "#01337a", "#2563eb", "#16a34a", "#f43f5e",
  "#f59e0b", "#7c3aed", "#0891b2", "#be185d",
];

export default function SupervisorAnalytics() {
  const isSmallScreen = useMediaQuery("(max-width:900px)");

  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // GET /api/supervisor/reports/groups  (protect + isSupervisor)
        // supervisorController.getSupervisorGroupsForReports
        // Response: {
        //   success, count,
        //   groups: [{
        //     id, _id, title, members: [names],
        //     milestones: [{
        //       week, templateCode, templateLabel,
        //       status ("Approved"/"Under Review"/"Rejected"),
        //       feedback, uploadedAt, fileName
        //     }]
        //   }]
        // }
        const res  = await fetch(`${BASE_URL}/supervisor/reports/groups`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (data.success) {
          setGroups(data.groups || []);
        } else {
          setError("Data load karne mein masla hua.");
        }
      } catch (e) {
        console.error("Analytics fetch error:", e);
        setError("Server se connection nahi ho saka.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derived data ──────────────────────────────────────────────────

  // Per group: count approved templates out of ALL_TEMPLATES (9)
  // progress % = (approved / 9) * 100
  const groupProgressData = groups.map((g, idx) => {
    const approvedCount = g.milestones?.filter(
      (m) => m.status === "Approved" || m.status === "approved"
    ).length || 0;
    return {
      label:         g.id
        ? `grp-${String(g.id).slice(-5)}`
        : `Group ${idx + 1}`,
      fullTitle:     g.title || "Untitled",
      approvedCount,
      totalTemplates: ALL_TEMPLATES.length,
      percent:       Math.round((approvedCount / ALL_TEMPLATES.length) * 100),
      color:         GROUP_COLORS[idx % GROUP_COLORS.length],
      milestones:    g.milestones || [],
    };
  });

  // ── Bar Chart — Group Performance Comparison ──
  // X-axis: group labels, Y-axis: % templates approved
  const barData = {
    labels: groupProgressData.map((g) => g.label),
    datasets: [
      {
        label: "Templates Approved (%)",
        data:  groupProgressData.map((g) => g.percent),
        backgroundColor: groupProgressData.map((g) => g.color),
        borderRadius: 6,
        barThickness:    isSmallScreen ? 36 : 48,
        maxBarThickness: 60,
      },
    ],
  };

  // ── Line Charts — per group milestone progress ──
  // X-axis: template codes (t01-t09), Y-axis: 100 if Approved, 50 if Under Review, 0 if not submitted
  const groupLineCharts = groupProgressData.map((g, idx) => {
    // Map each template code to a value
    const scoreMap = {};
    g.milestones.forEach((m) => {
      const code = (m.templateCode || "").toLowerCase();
      if (m.status === "Approved" || m.status === "approved") {
        scoreMap[code] = 100;
      } else if (m.status === "Under Review" || m.status === "Pending Review") {
        scoreMap[code] = 50;
      } else if (m.status === "Rejected" || m.status === "rejected") {
        scoreMap[code] = 20;
      } else {
        scoreMap[code] = 0;
      }
    });

    const scores = ALL_TEMPLATES.map((code) => scoreMap[code] ?? 0);

    const lineData = {
      labels: ALL_TEMPLATES.map((c) => c.toUpperCase()),
      datasets: [
        {
          label:              `${g.label} Progress`,
          data:               scores,
          borderColor:        g.color,
          backgroundColor:    g.color + "22",
          pointBackgroundColor: g.color,
          tension:            0.4,
          fill:               true,
          pointRadius:        5,
          pointHoverRadius:   9,
          borderWidth:        3,
        },
      ],
    };

    // Summary chips
    const approvedTemplates  = g.milestones.filter((m) => m.status === "Approved" || m.status === "approved");
    const pendingTemplates   = g.milestones.filter((m) => m.status === "Under Review" || m.status === "Pending Review");
    const rejectedTemplates  = g.milestones.filter((m) => m.status === "Rejected" || m.status === "rejected");
    const notSubmitted       = ALL_TEMPLATES.length - g.milestones.length;

    return (
      <Grid item xs={12} md={6} lg={4} key={g.label}>
        <Card className="analytics-card">
          <CardContent className="analytics-card-content">
            <Typography
              variant="h6"
              fontWeight={900}
              style={{ color: g.color }}
              className="group-title"
              title={g.fullTitle}
            >
              {g.label}
            </Typography>
            <Typography variant="body2" style={{ color: "#64748b", marginBottom: 4, fontSize: 12 }}>
              {g.fullTitle.length > 40 ? g.fullTitle.slice(0, 40) + "…" : g.fullTitle}
            </Typography>

            <Box className="line-chart-box">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  plugins: {
                    legend:  { display: false },
                    title:   { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const val = ctx.raw;
                          if (val === 100) return "Approved";
                          if (val === 50)  return "Under Review";
                          if (val === 20)  return "Rejected";
                          return "Not Submitted";
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        stepSize: 50,
                        font: { size: 11 },
                        callback: (v) =>
                          v === 100 ? "✓ Done" :
                          v === 50  ? "⏳ Review" :
                          v === 20  ? "✗ Reject" : "—",
                      },
                    },
                    x: { ticks: { font: { size: 11 } } },
                  },
                }}
                height={140}
              />
            </Box>

            {/* Summary chips */}
            <Box style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                ✓ {approvedTemplates.length} Approved
              </span>
              <span style={{ background: "#fef9c3", color: "#b45309", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                ⏳ {pendingTemplates.length} Review
              </span>
              {rejectedTemplates.length > 0 && (
                <span style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                  ✗ {rejectedTemplates.length} Rejected
                </span>
              )}
              {notSubmitted > 0 && (
                <span style={{ background: "#f1f5f9", color: "#64748b", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                  — {notSubmitted} Pending
                </span>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  });

  return (
    <Box>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      <DashboardSectionHeader
        description={`Here you can see overall analysis. How particular groups are performing in certain milestones and the pictorial graph to view the groups performance comparison`}
      >
        Analytics
      </DashboardSectionHeader>

      <div className="analytics-container">

        {/* ── Bar Chart ── */}
        <Box className="bar-chart-box">
          <Card className="bar-card">
            <CardContent>
              <Typography variant="h6" color="primary" fontWeight={900} className="bar-title">
                Group Performance Comparison
              </Typography>
              <Typography variant="body2" style={{ color: "#64748b", marginBottom: 8 }}>
                Templates approved out of {ALL_TEMPLATES.length} total
              </Typography>

              {loading ? (
                <Box>
                  <Skeleton height={200} />
                </Box>
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : groups.length === 0 ? (
                <Typography style={{ color: "#94a3b8", padding: "20px 0" }}>
                  Koi group assign nahi hai abhi.
                </Typography>
              ) : (
                <Box className="bar-inner-box">
                  <Bar
                    data={barData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        title:  { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx) =>
                              `${ctx.raw}% (${groupProgressData[ctx.dataIndex]?.approvedCount}/${ALL_TEMPLATES.length} approved)`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: { font: { size: 14, weight: "bold" }, color: "#01337a" },
                        },
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            stepSize: 20,
                            font: { size: 13, weight: "bold" },
                            color: "#01337a",
                            callback: (v) => v + "%",
                          },
                        },
                      },
                    }}
                    height={110}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* ── Line Charts per group ── */}
        {loading ? (
          <Grid container spacing={2} style={{ marginTop: 16 }}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} md={4} key={i}>
                <Card className="analytics-card">
                  <CardContent>
                    <Skeleton height={24} width="50%" />
                    <Skeleton height={140} />
                    <Skeleton height={20} width="80%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : groups.length === 0 ? null : (
          <Grid container spacing={2} style={{ marginTop: 16 }}>
            {groupLineCharts}
          </Grid>
        )}

      </div>
    </Box>
  );
}