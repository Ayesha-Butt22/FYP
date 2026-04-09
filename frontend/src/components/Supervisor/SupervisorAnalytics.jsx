import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
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
  CircularProgress,
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

export default function SupervisorAnalytics() {
  const isSmallScreen = useMediaQuery("(max-width:900px)");
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Groups for Progress
        const groupsRes = await axios.get("http://localhost:5000/api/supervisor/groups", { headers });
        
        // Fetch Performance (Scores)
        const performanceRes = await axios.get("http://localhost:5000/api/coordinator/final-results", { headers });

        if (groupsRes.data.success) {
          setGroupData(groupsRes.data.groups);
        }

        if (performanceRes.data.success) {
          // Filter performance data to only show groups I supervise 
          // (Backend handles it if I am a supervisor, or I filter by my groups in frontend)
          const myGroupIds = groupsRes.data.groups.map(g => String(g.groupId).toLowerCase());
          const filtered = performanceRes.data.data.filter(r => myGroupIds.includes(String(r.groupId).toLowerCase()));
          setPerformanceData(filtered);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Bar chart for overall group progress (%)
  const barData = useMemo(() => {
    return {
      labels: groupData.map((g) => g.maskedGroupId),
      datasets: [
        {
          label: "Milestone Progress (%)",
          data: groupData.map((g) => Math.round(((g.milestonesCompleted || 0) / (g.milestonesTotal || 8)) * 100)),
          backgroundColor: "#01337a",
          borderRadius: 8,
          barThickness: isSmallScreen ? 30 : 45,
        },
      ],
    };
  }, [groupData, isSmallScreen]);

  // Aggregate Performance by Group for Line Charts
  const groupPerformanceSummaries = useMemo(() => {
    const summaries = {};

    performanceData.forEach(p => {
      const gid = p.groupId;
      const masked = groupData.find(g => String(g.groupId) === String(gid))?.maskedGroupId || gid;
      if (!summaries[masked]) {
        summaries[masked] = [];
      }
      // Add a data point: year/milestone and score
      summaries[masked].push({
        milestone: p.year, // "FYP-1" or "FYP-2"
        score: p.finalScore
      });
    });

    return summaries;
  }, [performanceData, groupData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box>
      <DashboardSectionHeader
        description="Comprehensive analysis of group progress and performance metrics. Monitor real-time completion levels and evaluation trends."
      >
        Supervisor Analytics
      </DashboardSectionHeader>

      <div className="analytics-container">
        {/* Comparison Bar Chart */}
        <Box className="bar-chart-box" sx={{ mb: 4 }}>
          <Card className="bar-card" sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h6"
                color="primary"
                fontWeight={900}
                sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                📊 Group Progress Comparison (%)
              </Typography>
              <Box className="bar-inner-box" sx={{ height: 350 }}>
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: { backgroundColor: '#01337a' }
                    },
                    scales: {
                      x: {
                        ticks: { font: { size: 13, weight: "bold" }, color: "#64748b" },
                        grid: { display: false }
                      },
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { stepSize: 20, font: { size: 12 }, color: "#64748b" }
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Individual Group Trends (Performance Scores) */}
        <Typography variant="h6" color="#01337a" fontWeight={900} sx={{ mt: 5, mb: 3 }}>
          📈 Milestone Performance Trends
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(groupPerformanceSummaries).map(([maskedId, trends]) => {
            const chartData = {
              labels: trends.map(t => t.milestone),
              datasets: [{
                label: 'Performance Score',
                data: trends.map(t => t.score),
                borderColor: "#01337a",
                backgroundColor: "rgba(1, 51, 122, 0.1)",
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 10,
                borderWidth: 3,
              }]
            };

            return (
              <Grid item xs={12} md={4} key={maskedId}>
                <Card className="analytics-card" sx={{ height: '100%', borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' } }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={900} color="#01337a" gutterBottom>
                      {maskedId}
                    </Typography>
                    <Box sx={{ height: 180 }}>
                      <Line
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, max: 100, ticks: { font: { size: 10 } } },
                            x: { ticks: { font: { size: 11, weight: 'bold' } } }
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {trends.map((t, idx) => (
                        <Box key={idx} sx={{ px: 1.5, py: 0.5, bgcolor: '#f1f5f9', borderRadius: 2, fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                          {t.milestone}: {t.score}%
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </div>
    </Box>
  );
}

