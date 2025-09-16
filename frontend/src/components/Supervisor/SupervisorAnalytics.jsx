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
import { Card, CardContent, Typography, Grid, Box, useMediaQuery } from "@mui/material";
import DashboardSectionHeader from "./DashboardSectionHeader";

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
    { name: "G-103", progress: 35 }
  ],
  groupMilestones: {
    "G-101": [
      { milestone: "Proposal", score: 95 },
      { milestone: "Mid Eval", score: 70 },
      { milestone: "Final Eval", score: 35 }
    ],
    "G-102": [
      { milestone: "Proposal", score: 80 },
      { milestone: "Mid Eval", score: 45 },
      { milestone: "Final Eval", score: 0 }
    ],
    "G-103": [
      { milestone: "Proposal", score: 55 },
      { milestone: "Mid Eval", score: 25 },
      { milestone: "Final Eval", score: 0 }
    ]
  }
};

export default function SupervisorAnalytics() {
  const isSmallScreen = useMediaQuery("(max-width:900px)");

  const barData = {
    labels: analyticsData.groupProgress.map(g => g.name),
    datasets: [
      {
        label: "Overall Progress (%)",
        data: analyticsData.groupProgress.map(g => g.progress),
        backgroundColor: "#2563eb",
        borderRadius: 6,
        barThickness: isSmallScreen ? 36 : 48,
        maxBarThickness: 60
      }
    ]
  };

  // Milestone line charts for each group
  const groupLineCharts = Object.entries(analyticsData.groupMilestones).map(
    ([groupName, milestones]) => {
      const lineData = {
        labels: milestones.map(m => m.milestone),
        datasets: [
          {
            label: `${groupName} Milestone Progress`,
            data: milestones.map(m => m.score),
            borderColor: "#2563eb",
            backgroundColor: "#2563eb22",
            pointBackgroundColor: "#1d4ed8",
            tension: 0.4,
            fill: true,
            pointRadius: 6,
            pointHoverRadius: 11,
            borderWidth: 3,
          }
        ]
      };
      return (
        <Grid item xs={12} md={4} key={groupName}>
          <Card
            sx={{
              borderRadius: 5,
              boxShadow: "0 8px 32px #2563eb22",
              p: 1.5,
              background: "#f8fbff",
              minHeight: 310,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <CardContent sx={{width: "100%", p: 2, display: "flex", flexDirection: "column", alignItems: "center"}}>
              <Typography
                variant="h6"
                color="primary"
                fontWeight={900}
                sx={{
                  mb: 1.5,
                  textAlign: "center",
                  fontSize: "1.3rem"
                }}
              >
                {groupName}
              </Typography>
              <Box sx={{
                width: { xs: "100%", sm: 320, md: 340, lg: 360 },
                mx: "auto"
              }}>
                <Line
                  data={lineData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      title: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { stepSize: 20, font: { size: 12 } }
                      },
                      x: {
                        ticks: { font: { size: 13 } }
                      }
                    }
                  }}
                  height={125}
                />
              </Box>
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  fontSize: 15,
                  color: "#374151",
                  fontWeight: 700,
                  flexWrap: "wrap"
                }}
              >
                {milestones.map((m, i) => (
                  <span key={i} style={{ minWidth: 95 }}>
                    <span style={{ color: "#2563eb" }}>{m.milestone}:</span>{" "}
                    {m.score}%
                  </span>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      );
    }
  );

  return (
    <div style={{ padding: "24px 0", maxWidth: 1350, margin: "0 auto" }}>
      <DashboardSectionHeader>
        Analytics
      </DashboardSectionHeader>
      <Grid container spacing={2}>
        {/* Top row: milestone progress line charts for all groups */}
        {groupLineCharts}
      </Grid>
      {/* Compact bar chart for group comparison */}
      <Box sx={{ width: "100%", mt: 3 }}>
        <Card
          sx={{
            borderRadius: 5,
            boxShadow: "0 8px 32px #2563eb1b",
            background: "#f8fbff",
            p: 2.5,
            mx: "auto",
            maxWidth: 700,
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              color="primary"
              fontWeight={900}
              sx={{ mb: 2, letterSpacing: "-1.2px", textAlign: "center" }}
            >
              Group Performance Comparison
            </Typography>
            <Box sx={{ width: "100%", maxWidth: 550, mx: "auto" }}>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: { stepSize: 20, font: { size: 11 } }
                    }
                  }
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