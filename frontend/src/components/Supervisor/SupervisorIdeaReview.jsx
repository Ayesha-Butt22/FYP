import React, { useState } from "react";
import {
  Box, Table, TableHead, TableBody, TableRow, TableCell,
  Collapse, IconButton, Chip, Tooltip, Stack, Avatar, Divider, TextField, Button, Radio, Typography
} from "@mui/material";
import {
  GroupOutlined, ExpandMore, ExpandLess,
  CheckCircleOutline, HourglassEmptyOutlined, CancelOutlined,
  ThumbUpAlt, ThumbDownAlt, WarningAmber
} from "@mui/icons-material";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import "./SupervisorIdeaReview.css";

// Dummy data
const DUMMY_IDEAS = [
  {
    ideaId: "G-101",
    groupName: "Group 1",
    title: "Smart Attendance System",
    status: "approved",
    abstract: "A web-based attendance monitoring system using face recognition.",
    methodology: "Face recognition, web app, database.",
    tools: "React, Node.js, Python",
    domain: "AI",
    members: [
      { name: "Ali Raza", sapId: "2021001" },
      { name: "Sana Tariq", sapId: "2021002" },
      { name: "Bilal Khan", sapId: "2021003" },
    ],
    feedback: {
      severity: "✅",
      comment: "Well written, project approved."
    }
  },
  {
    ideaId: "G-102",
    groupName: "Group 2",
    title: "AI-Based Disease Prediction",
    status: "pending",
    abstract: "Predict diseases using patient data and ML.",
    methodology: "Data collection, preprocessing, ML models.",
    tools: "Python, Scikit-learn, React",
    domain: "AI/ML",
    members: [
      { name: "Ayesha Butt", sapId: "2021004" },
      { name: "Madiha Sumbal", sapId: "2021005" },
      { name: "Saad Farooq", sapId: "2021006" },
    ],
    feedback: null
  },
  {
    ideaId: "G-103",
    groupName: "Group 3",
    title: "Online Exam Proctoring",
    status: "rejected",
    abstract: "Web-based system for online exam proctoring using webcam and AI.",
    methodology: "Webcam monitoring, anomaly detection.",
    tools: "React, Node.js, TensorFlow.js",
    domain: "Security/AI",
    members: [
      { name: "Fatima Noor", sapId: "2021007" },
      { name: "Usman Ghani", sapId: "2021008" },
      { name: "Hira Qureshi", sapId: "2021009" },
    ],
    feedback: {
      severity: "❌",
      comment: "Methodology vague. Please clarify how anomalies will be detected."
    }
  },
];

const STATUS = {
  approved: {
    label: "Approved",
    icon: <CheckCircleOutline style={{ color: "#219653" }} />,
    chipStyle: {
      backgroundColor: "#e9fbf0", color: "#219653", border: "1.5px solid #b7eccb", fontWeight: 700
    }
  },
  pending: {
    label: "Pending",
    icon: <HourglassEmptyOutlined style={{ color: "#f2994a" }} />,
    chipStyle: {
      backgroundColor: "#fff7de", color: "#b97b16", border: "1.5px solid #ffe6b2", fontWeight: 700
    }
  },
  rejected: {
    label: "Rejected",
    icon: <CancelOutlined style={{ color: "#e74c3c" }} />,
    chipStyle: {
      backgroundColor: "#ffeaea", color: "#e74c3c", border: "1.5px solid #ffb7b7", fontWeight: 700
    }
  }
};

const FEEDBACK_OPTIONS = [
  {
    value: "❌",
    label: "Major Issue",
    color: "#e74c3c",
    icon: <CancelOutlined sx={{ color: "#e74c3c", fontSize: 23, mr: 1 }} />
  },
  {
    value: "⚠️",
    label: "Minor Fix",
    color: "#f2994a",
    icon: <WarningAmber sx={{ color: "#f2994a", fontSize: 23, mr: 1 }} />
  },
  {
    value: "✅",
    label: "Approved",
    color: "#219653",
    icon: <CheckCircleOutline sx={{ color: "#219653", fontSize: 23, mr: 1 }} />
  }
];

const FEEDBACK_ICON_ONLY = {
  "❌": <CancelOutlined sx={{ color: "#e74c3c", fontSize: 23, mr: 1 }} />,
  "✅": <CheckCircleOutline sx={{ color: "#219653", fontSize: 23, mr: 1 }} />,
  "⚠️": <WarningAmber sx={{ color: "#f2994a", fontSize: 23, mr: 1 }} />
};

export default function SupervisorIdeaReview() {
  const [ideas, setIdeas] = useState(DUMMY_IDEAS);
  const [expanded, setExpanded] = useState({});
  const [feedback, setFeedback] = useState({});

  const thStyle = {
    fontWeight: 800,
    fontSize: 17,
    color: "#01337a",
    borderBottom: "2.5px solid #e5e7eb",
    background: "#f4f6fa"
  };
  const tdStyle = {
    fontSize: 15,
    color: "#22223b"
  };

  const handleReview = (ideaId, status) => {
    const fb = feedback[ideaId];
    setIdeas(old =>
      old.map(idea =>
        idea.ideaId === ideaId
          ? {
              ...idea,
              status,
              feedback: {
                severity: fb.severity,
                comment: fb.comment
              }
            }
          : idea
      )
    );
    setFeedback(f => ({ ...f, [ideaId]: { severity: "", comment: "" } }));
  };

  return (
    <Box maxWidth={1060} mx="auto" my={4}>
      <DashboardSectionHeader>FYP Idea & Proposal Review</DashboardSectionHeader>
      <Box className="review-table-box">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={thStyle}>
                <GroupOutlined sx={{verticalAlign:"middle", color:"#2563eb", mr:1}} />
                Group
              </TableCell>
              <TableCell sx={thStyle}>Title</TableCell>
              <TableCell sx={thStyle}>Status</TableCell>
              <TableCell sx={thStyle} align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ideas.map(idea => {
              const isExpanded = expanded[idea.ideaId];
              const status = STATUS[idea.status];
              return (
                <React.Fragment key={idea.ideaId}>
                  <TableRow hover className="review-table-row">
                    <TableCell sx={tdStyle}>
                      <Stack direction="row" gap={1} alignItems="center">
                        <Avatar sx={{ width: 30, height: 30, bgcolor: "#2563eb", fontWeight:700, fontSize:17 }}>
                          {idea.groupName.split(" ")[1]}
                        </Avatar>
                        <Typography fontWeight={700}>{idea.groupName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={tdStyle}>
                      <Tooltip title={idea.title}>
                        <Typography fontWeight={600} color="#01337a" sx={{
                          maxWidth:170, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"
                        }}>
                          {idea.title}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={tdStyle}>
                      <Chip
                        icon={status.icon}
                        label={status.label}
                        sx={{
                          px: 1.5, ...status.chipStyle, borderRadius: 25, fontWeight: 700,
                          fontSize: 15, height: 32, minWidth: 120, justifyContent: "left"
                        }}
                      />
                    </TableCell>
                    <TableCell sx={tdStyle} align="center">
                      <IconButton
                        color="primary"
                        onClick={() =>
                          setExpanded(exp => ({ ...exp, [idea.ideaId]: !exp[idea.ideaId] }))
                        }
                        aria-label={isExpanded ? "Hide Details" : "Show Details"}
                      >
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="review-table-collapse-cell">
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box p={3} borderBottom="2px solid #e5e7eb" borderRadius={2}>
                          <Stack spacing={1.3} direction={{ xs: "column", md: "row" }} divider={<Divider orientation="vertical" flexItem />}>
                            <Box>
                              <Typography fontWeight={700} mb={0.5}>Abstract:</Typography>
                              <Typography fontSize={15} mb={1}>{idea.abstract}</Typography>
                              <Typography fontWeight={700} mb={0.5}>Methodology:</Typography>
                              <Typography fontSize={15} mb={1}>{idea.methodology}</Typography>
                              <Typography fontWeight={700} mb={0.5}>Tools:</Typography>
                              <Typography fontSize={15} mb={1}>{idea.tools}</Typography>
                              <Typography fontWeight={700} mb={0.5}>Domain:</Typography>
                              <Typography fontSize={15}>{idea.domain}</Typography>
                            </Box>
                            <Box minWidth={220}>
                              <Typography fontWeight={700} mb={0.5}>Members:</Typography>
                              <Stack spacing={1} mt={1.5}>
                                {idea.members.map((m, idx) => (
                                  <Stack key={idx} direction="row" alignItems="center" gap={1}>
                                    <Avatar sx={{
                                      width: 26, height: 26, bgcolor: "#f4f6fa", color: "#01337a", fontSize: 15, fontWeight: 700
                                    }}>{m.name[0]}</Avatar>
                                    <Typography fontWeight={600} fontSize={15}>{m.name}</Typography>
                                    <Typography color="#64748b" fontSize={14}>({m.sapId})</Typography>
                                  </Stack>
                                ))}
                              </Stack>
                            </Box>
                          </Stack>
                          <Divider sx={{ my: 2 }} />
                          {idea.status === "pending" ? (
                            <Box mt={1.5}>
                              <Typography fontWeight={700} fontSize={15} mb={0.5}>Supervisor Feedback:</Typography>
                              <Stack direction="row" spacing={2} mt={1}>
                                {FEEDBACK_OPTIONS.map(opt => (
                                  <Box key={opt.value} display="flex" alignItems="center">
                                    <Radio
                                      checked={feedback[idea.ideaId]?.severity === opt.value}
                                      onChange={e =>
                                        setFeedback(f => ({
                                          ...f,
                                          [idea.ideaId]: { ...f[idea.ideaId], severity: opt.value }
                                        }))
                                      }
                                      value={opt.value}
                                      sx={{
                                        color: opt.color,
                                        '&.Mui-checked': { color: opt.color }
                                      }}
                                    />
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                      {opt.icon}
                                      <Typography sx={{
                                        color: opt.color, fontWeight: 600, fontSize: 16
                                      }}>
                                        {opt.label}
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Stack>
                              <TextField
                                size="small"
                                variant="outlined"
                                placeholder="Write feedback for student..."
                                fullWidth
                                sx={{ my: 2, background: "#fff" }}
                                value={feedback[idea.ideaId]?.comment || ""}
                                onChange={e =>
                                  setFeedback(f => ({
                                    ...f,
                                    [idea.ideaId]: { ...f[idea.ideaId], comment: e.target.value }
                                  }))
                                }
                              />
                              <Stack direction="row" gap={2}>
                                <Button
                                  variant="contained"
                                  color="success"
                                  startIcon={<ThumbUpAlt />}
                                  disabled={
                                    !feedback[idea.ideaId]?.comment ||
                                    !feedback[idea.ideaId]?.severity
                                  }
                                  onClick={() => handleReview(idea.ideaId, "approved")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="contained"
                                  color="error"
                                  startIcon={<ThumbDownAlt />}
                                  disabled={
                                    !feedback[idea.ideaId]?.comment ||
                                    !feedback[idea.ideaId]?.severity
                                  }
                                  onClick={() => handleReview(idea.ideaId, "rejected")}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            </Box>
                          ) : (
                            <Box mt={2} display="flex" alignItems="center" gap={1}>
                              <b>Feedback:</b>
                              {idea.feedback ? (
                                <>
                                  <span>
                                    {FEEDBACK_ICON_ONLY[idea.feedback.severity]}
                                  </span>
                                  <span style={{ marginLeft: 6 }}>{idea.feedback.comment}</span>
                                </>
                              ) : (
                                <span style={{ color: "#aaa" }}>No feedback</span>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}