import React from "react";
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

const analyticsData = {
  groupProgress: [
    { name: "G-101", progress: 80 },
    { name: "G-102", progress: 60 },
    { name: "G-103", progress: 35 },
  ],
  groupMilestones: {
    "G-101": [
      { milestone: "Proposal", score: 95 },
      { milestone: "Mid Eval", score: 70 },
      { milestone: "Final Eval", score: 35 },
    ],
    "G-102": [
      { milestone: "Proposal", score: 80 },
      { milestone: "Mid Eval", score: 45 },
      { milestone: "Final Eval", score: 0 },
    ],
    "G-103": [
      { milestone: "Proposal", score: 55 },
      { milestone: "Mid Eval", score: 25 },
      { milestone: "Final Eval", score: 0 },
    ],
  },
};

export default function SupervisorAnalytics() {
  const isSmallScreen = useMediaQuery("(max-width:900px)");

  const barData = {
    labels: analyticsData.groupProgress.map((g) => g.name),
    datasets: [
      {
        label: "Overall Progress (%)",
        data: analyticsData.groupProgress.map((g) => g.progress),
        backgroundColor: "#2563eb",
        borderRadius: 6,
        barThickness: isSmallScreen ? 36 : 48,
        maxBarThickness: 60,
      },
    ],
  };

  const groupLineCharts = Object.entries(
    analyticsData.groupMilestones
  ).map(([groupName, milestones]) => {
    const lineData = {
      labels: milestones.map((m) => m.milestone),
      datasets: [
        {
          label: `${groupName} Milestone Progress`,
          data: milestones.map((m) => m.score),
          borderColor: "#2563eb",
          backgroundColor: "#2563eb22",
          pointBackgroundColor: "#1d4ed8",
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 11,
          borderWidth: 3,
        },
      ],
    };

    return (
      <Grid item xs={12} md={4} key={groupName}>
        <Card className="analytics-card">
          <CardContent className="analytics-card-content">
            <Typography variant="h6" color="primary" fontWeight={900} className="group-title">
              {groupName}
            </Typography>
            <Box className="line-chart-box">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false }, title: { display: false } },
                  scales: {
                    y: { beginAtZero: true, max: 100, ticks: { stepSize: 20, font: { size: 12 } } },
                    x: { ticks: { font: { size: 13 } } },
                  },
                }}
                height={125}
              />
            </Box>
            <Box className="milestone-list">
              {milestones.map((m, i) => (
                <span key={i} className="milestone-item">
                  <span className="milestone-label">{m.milestone}:</span> {m.score}%
                </span>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  });

  return (
    <div className="analytics-container">
      <DashboardSectionHeader style={{ marginLeft: "75px" , marginBottom: "50px", marginTop: "-20px"}}>Analytics</DashboardSectionHeader>
      <Grid container spacing={2}>{groupLineCharts}</Grid>
      <Box className="bar-chart-box">
        <Card className="bar-card">
          <CardContent>
            <Typography variant="h6" color="primary" fontWeight={900} className="bar-title">
              Group Performance Comparison
            </Typography>
            <Box className="bar-inner-box">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false }, title: { display: false } },
                  scales: {
                    y: { beginAtZero: true, max: 100, ticks: { stepSize: 20, font: { size: 11 } } },
                  },
                }}
                height={110}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}
