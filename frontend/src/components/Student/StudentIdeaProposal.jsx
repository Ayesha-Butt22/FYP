import React, { useState } from "react";
import {
  Box, TextField, Button, Chip, Stack, Typography, Divider, Paper
} from "@mui/material";
import { CheckCircle, HourglassEmpty, Cancel, Edit, Autorenew } from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./StudentIdeaProposal.css";

// Dummy data to simulate status flow and feedback
const DUMMY_STATUS_FLOW = [
  { key: "draft", label: "Draft", icon: <Edit />, color: "#64748b" },
  { key: "supervisor-selection", label: "Supervisor Selection", icon: <Autorenew />, color: "#2563eb" },
  { key: "supervisor-review", label: "Supervisor Review", icon: <HourglassEmpty />, color: "#f59e42" },
  { key: "coordinator-review", label: "Coordinator", icon: <HourglassEmpty />, color: "#eab308" },
  { key: "approved", label: "Approved", icon: <CheckCircle />, color: "#16a34a" },
  { key: "rejected", label: "Rejected", icon: <Cancel />, color: "#e11d48" },
];

// Helper for feedback chip color
const feedbackColor = (from) =>
  from === "supervisor"
    ? { background: "#e0e7ff", color: "#3730a3" }
    : { background: "#fef9c3", color: "#a16207" };

export default function StudentIdeaProposal() {
  // Main idea form state
  const [idea, setIdea] = useState({
    title: "",
    abstract: "",
    tools: "",
    keywords: "",
  });
  // Status
  const [status, setStatus] = useState("draft"); // one of flow keys
  // Feedback from supervisor/coordinator
  const [feedback, setFeedback] = useState([
    // Example feedback objects:
    // { from: "supervisor", comment: "Clarify tools.", severity: "minor" }
    // { from: "coordinator", comment: "Well done.", severity: "approved" }
  ]);
  // For Title Rewriter (optional)
  const [aiTitle, setAiTitle] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Status step helper
  const currentStepIdx = DUMMY_STATUS_FLOW.findIndex((s) => s.key === status);

  // Handlers
  const handleInput = (field, v) => setIdea({ ...idea, [field]: v });
  const handleSubmit = () => {
    // Post to backend here
    setStatus("supervisor-selection");
  };

  // Simulate AI Title Rewriter (replace with real API call)
  const handleRewrite = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiTitle("Smart Automated Attendance Tracker System");
      setAiLoading(false);
    }, 1000);
  };

  // For demo: simulate status transitions
  const simulateSupervisorReview = () => {
    setStatus("supervisor-review");
    setFeedback([
      { from: "supervisor", comment: "Abstract is good, but specify ML model.", severity: "minor" },
    ]);
  };
  const simulateCoordinatorReview = () => {
    setStatus("coordinator-review");
    setFeedback([
      ...feedback,
      { from: "coordinator", comment: "Please attach project timeline.", severity: "minor" },
    ]);
  };
  const simulateApproval = () => {
    setStatus("approved");
    setFeedback([
      ...feedback,
      { from: "coordinator", comment: "Idea approved! Good luck.", severity: "approved" },
    ]);
  };
  const simulateRejection = () => {
    setStatus("rejected");
    setFeedback([
      ...feedback,
      { from: "coordinator", comment: "Project scope too broad. Narrow it down.", severity: "rejected" },
    ]);
  };

  return (
    <>
      <DashboardSectionHeader>Project Idea & Proposal</DashboardSectionHeader>
      <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Status Tracker */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4, mt: 3 }}>
          {DUMMY_STATUS_FLOW.map((s, idx) => (
            <React.Fragment key={s.key}>
              <Stack alignItems="center" spacing={0.7}>
                <Chip
                  icon={s.icon}
                  label={s.label}
                  sx={{
                    bgcolor: idx < currentStepIdx
                      ? "#e0e7ff"
                      : idx === currentStepIdx
                        ? s.color
                        : "#f1f5f9",
                    color: idx === currentStepIdx
                      ? "#fff"
                      : idx < currentStepIdx
                        ? "#3730a3"
                        : "#64748b",
                    fontWeight: 900,
                    fontSize: 16,
                    px: 2,
                    py: 1,
                    height: 46,
                    mb: 0.5,
                  }}
                />
                {idx < DUMMY_STATUS_FLOW.length - 1 && (
                  <div
                    style={{
                      width: 34,
                      height: 6,
                      background: idx < currentStepIdx ? "#2563eb" : "#cbd5e1",
                      borderRadius: 3,
                      margin: "0 2px",
                    }}
                  />
                )}
              </Stack>
            </React.Fragment>
          ))}
        </Box>

        {/* Feedback */}
        {feedback.length > 0 && (
          <Box sx={{ my: 2, textAlign: "center" }}>
            {feedback.map((fb, i) => (
              <Chip
                key={i}
                label={
                  <span>
                    <b>{fb.from === "supervisor" ? "Supervisor" : "Coordinator"}:</b> {fb.comment}
                  </span>
                }
                sx={{
                  ...feedbackColor(fb.from),
                  fontWeight: 800,
                  fontSize: 15,
                  px: 1.7,
                  my: 0.4,
                  mr: 1.5,
                }}
              />
            ))}
          </Box>
        )}

        {/* Idea Form */}
        {status === "draft" && (
          <Paper sx={{ p: 4, mt: 3, borderRadius: 6, boxShadow: 2 }}>
            <Typography fontWeight={900} fontSize={26} sx={{ color: "#01337a", mb: 2 }}>
              Idea Proposal Form
            </Typography>
            <Stack spacing={3}>
              <Box>
                <TextField
                  label="Project Title"
                  fullWidth
                  value={idea.title}
                  onChange={e => handleInput("title", e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<Autorenew />}
                        onClick={handleRewrite}
                        disabled={aiLoading}
                        sx={{ ml: 2, fontWeight: 700, color: "#2563eb" }}
                      >
                        {aiLoading ? "Rewriting..." : "AI Suggest"}
                      </Button>
                    ),
                  }}
                />
                {aiTitle && (
                  <Typography sx={{ mt: 1, color: "#16a34a", fontWeight: 600 }}>
                    AI Suggestion: "{aiTitle}"
                  </Typography>
                )}
              </Box>
              <TextField
                label="Abstract"
                multiline
                minRows={3}
                fullWidth
                value={idea.abstract}
                onChange={e => handleInput("abstract", e.target.value)}
                required
              />
              <TextField
                label="Tools / Technologies"
                fullWidth
                value={idea.tools}
                onChange={e => handleInput("tools", e.target.value)}
                placeholder="e.g. React, Node.js, Python"
                required
              />
              <TextField
                label="Keywords"
                fullWidth
                value={idea.keywords}
                onChange={e => handleInput("keywords", e.target.value)}
                placeholder="AI, Attendance, Web"
                required
              />
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{ px: 7, py: 1.2, fontWeight: 900, fontSize: 18, borderRadius: 3, bgcolor: "#2563eb" }}
                  onClick={handleSubmit}
                  disabled={
                    !idea.title.trim() ||
                    !idea.abstract.trim() ||
                    !idea.tools.trim() ||
                    !idea.keywords.trim()
                  }
                >
                  Submit Idea
                </Button>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Simulate status transitions for demo/testing */}
        {status === "supervisor-selection" && (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography fontWeight={800} fontSize={23} color="#2563eb">
              Please select your supervisor to proceed.
            </Typography>
            <Button variant="outlined" sx={{ mt: 3, mr: 2 }} onClick={simulateSupervisorReview}>
              Simulate Supervisor Review
            </Button>
          </Box>
        )}
        {status === "supervisor-review" && (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography fontWeight={800} fontSize={23} color="#f59e42">
              Supervisor is reviewing your proposal.
            </Typography>
            <Button variant="outlined" sx={{ mt: 3, mr: 2 }} onClick={simulateCoordinatorReview}>
              Simulate Coordinator Review
            </Button>
          </Box>
        )}
        {status === "coordinator-review" && (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography fontWeight={800} fontSize={23} color="#eab308">
              Coordinator is reviewing your proposal.
            </Typography>
            <Button variant="contained" sx={{ mt: 3, mr: 2, bgcolor: "#16a34a" }} onClick={simulateApproval}>
              Simulate Approval
            </Button>
            <Button variant="contained" sx={{ mt: 3, ml: 2, bgcolor: "#e11d48" }} onClick={simulateRejection}>
              Simulate Rejection
            </Button>
          </Box>
        )}
        {status === "approved" && (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Chip
              icon={<CheckCircle />}
              label="Your project proposal is approved! 🎉"
              sx={{
                bgcolor: "#e0fce0",
                color: "#15803d",
                fontWeight: 900,
                fontSize: 18,
                px: 3,
                py: 2,
                my: 2,
              }}
            />
          </Box>
        )}
        {status === "rejected" && (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Chip
              icon={<Cancel />}
              label="Your project proposal was rejected."
              sx={{
                bgcolor: "#fee2e2",
                color: "#e11d48",
                fontWeight: 900,
                fontSize: 18,
                px: 3,
                py: 2,
                my: 2,
              }}
            />
            <Typography sx={{ mt: 2, color: "#e11d48", fontWeight: 600 }}>
              Please review the feedback and resubmit with improvements.
            </Typography>
          </Box>
        )}

        <Divider sx={{ mt: 7, mb: 2 }} />
        <Typography sx={{ color: "#64748b", fontSize: 15, textAlign: "center", mb: 2 }}>
          Status flow: Fill proposal → Submit → Select Supervisor → Supervisor Review → Coordinator → Approved/Rejected
        </Typography>
      </Box>
    </>
  );
}