import React, { useState } from "react";
import {
  Box, Table, TableHead, TableBody, TableRow, TableCell,
  Collapse, IconButton, Chip, Tooltip, Stack, Divider, TextField, Button, Radio, Typography,
} from "@mui/material";
import {
  GroupOutlined, ExpandMore, ExpandLess,
  CheckCircleOutline, HourglassEmptyOutlined, CancelOutlined,
  ThumbUpAlt, ThumbDownAlt, WarningAmber,
} from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./SupervisorIdeaReview.css";

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
      comment: "Well written, project approved.",
    },
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
    feedback: null,
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
      comment: "Methodology vague. Please clarify how anomalies will be detected.",
    },
  },
];

const STATUS = {
  approved: {
    label: "Approved",
    icon: <CheckCircleOutline style={{ color: "#219653" }} />,
    chipStyle: {
      backgroundColor: "#e9fbf0", color: "#219653", border: "1.5px solid #b7eccb", fontWeight: 700,
    },
  },
  pending: {
    label: "Pending",
    icon: <HourglassEmptyOutlined style={{ color: "#f2994a" }} />,
    chipStyle: {
      backgroundColor: "#fff7de", color: "#b97b16", border: "1.5px solid #ffe6b2", fontWeight: 700,
    },
  },
  rejected: {
    label: "Rejected",
    icon: <CancelOutlined style={{ color: "#e74c3c" }} />,
    chipStyle: {
      backgroundColor: "#ffeaea", color: "#e74c3c", border: "1.5px solid #ffb7b7", fontWeight: 700,
    },
  },
};

const FEEDBACK_OPTIONS = [
  {
    value: "❌",
    label: "Major Issue",
    color: "#e74c3c",
    icon: <CancelOutlined sx={{ color: "#e74c3c", fontSize: 23, mr: 1 }} />,
  },
  {
    value: "⚠️",
    label: "Minor Fix",
    color: "#f2994a",
    icon: <WarningAmber sx={{ color: "#f2994a", fontSize: 23, mr: 1 }} />,
  },
  {
    value: "✅",
    label: "Approved",
    color: "#219653",
    icon: <CheckCircleOutline sx={{ color: "#219653", fontSize: 23, mr: 1 }} />,
  },
];

const FEEDBACK_ICON_ONLY = {
  "❌": <CancelOutlined sx={{ color: "#e74c3c", fontSize: 23, mr: 1 }} />,
  "✅": <CheckCircleOutline sx={{ color: "#219653", fontSize: 23, mr: 1 }} />,
  "⚠️": <WarningAmber sx={{ color: "#f2994a", fontSize: 23, mr: 1 }} />,
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
    background: "#f4f6fa",
    fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
  };
  const tdStyle = {
    fontSize: 15,
    color: "#22223b",
    fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
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
                comment: fb.comment,
              },
            }
          : idea
      )
    );
    // remove feedback entry after submitting
    setFeedback(f => {
      const copy = { ...f };
      delete copy[ideaId];
      return copy;
    });
  };

  return (
      <>
        <DashboardSectionHeader>
          FYP Idea & Proposal Review
        </DashboardSectionHeader>

        <div className="section-desc">
          Here you can post all the FYP groups ideas and proposal. Click "Action" to preview the group members involved,
          and also their abstract and methodology and tools used to design fyp.
        </div>

        <Box maxWidth={1500} mx="auto" my={4}>
          <Box className="review-table-box">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={thStyle}>
                    <GroupOutlined sx={{verticalAlign: "middle", color: "#2563eb", mr: 1}}/>
                    Group
                  </TableCell>
                  <TableCell sx={thStyle}>Title</TableCell>
                  <TableCell sx={thStyle}>Status</TableCell>
                  <TableCell sx={thStyle} align="center">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ideas.map((idea, idx) => {
                  const isExpanded = expanded[idea.ideaId];
                  const status = STATUS[idea.status];
                  return (
                      <React.Fragment key={idea.ideaId}>
                        <TableRow
                            hover
                            className="review-table-row"
                            sx={idea.status === "pending" ? {backgroundColor: "#fff9e6"} : {}}
                        >
                          <TableCell sx={tdStyle}>
                            <Stack direction="row" gap={1.5} alignItems="center">
                              <Typography className="group-number-badge">{idx + 1}</Typography>
                              <Typography fontWeight={700}>{idea.groupName}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={tdStyle}>
                            <Tooltip title={idea.title}>
                              <Typography
                                  fontWeight={600}
                                  color="#01337a"
                                  sx={{
                                    maxWidth: 170,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                      setExpanded(exp => ({
                                        ...exp,
                                        [idea.ideaId]: !exp[idea.ideaId],
                                      }))
                                  }
                              >
                                {idea.title}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={tdStyle}>
                            <Chip
                                icon={status.icon}
                                label={status.label}
                                sx={{
                                  px: 1.5,
                                  ...status.chipStyle,
                                  borderRadius: 25,
                                  fontWeight: 700,
                                  fontSize: 15,
                                  height: 32,
                                  minWidth: 120,
                                  justifyContent: "left",
                                  fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
                                }}
                            />
                          </TableCell>
                          <TableCell sx={tdStyle} align="center">
                            <IconButton
                                color="primary"
                                onClick={() =>
                                    setExpanded(exp => ({
                                      ...exp,
                                      [idea.ideaId]: !exp[idea.ideaId],
                                    }))
                                }
                                aria-label={isExpanded ? "Hide Details" : "Show Details"}
                            >
                              {isExpanded ? <ExpandLess/> : <ExpandMore/>}
                            </IconButton>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={4} className="review-table-collapse-cell">
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box className="idea-details-box">
                                <Box className="idea-details-section">
                                  <div className="idea-detail-row">
                                    <span className="idea-detail-label">Abstract:</span>
                                    <span className="idea-detail-value">{idea.abstract}</span>
                                  </div>
                                  <div className="idea-detail-row">
                                    <span className="idea-detail-label">Methodology:</span>
                                    <span className="idea-detail-value">{idea.methodology}</span>
                                  </div>
                                  <div className="idea-detail-row">
                                    <span className="idea-detail-label">Tools:</span>
                                    <span className="idea-detail-value">{idea.tools}</span>
                                  </div>
                                  <div className="idea-detail-row">
                                    <span className="idea-detail-label">Domain:</span>
                                    <span className="idea-detail-value">{idea.domain}</span>
                                  </div>
                                </Box>
                                <Box className="members-section-align">
                                  <span className="idea-detail-label" style={{marginBottom: 5}}>Members:</span>
                                  {idea.members.map((m, midx) => (
                                      <div className="member-row-enhanced" key={midx}>
                                        <span className="member-name">{m.name}</span>
                                        <span className="member-sapid">({m.sapId})</span>
                                      </div>
                                  ))}
                                </Box>
                              </Box>
                              <Divider sx={{my: 1}}/>

                              {idea.status === "pending" ? (
                                  <Box mt={1}>
                                    <Typography fontWeight={700} fontSize={15} mb={0.5}>
                                      Supervisor Feedback:
                                    </Typography>
                                    <Stack direction="row" spacing={2} mt={1}>
                                      {FEEDBACK_OPTIONS.map(opt => (
                                          <Box key={opt.value} display="flex" alignItems="center">
                                            <Radio
                                                checked={feedback[idea.ideaId]?.severity === opt.value}
                                                onChange={() =>
                                                    setFeedback(f => ({
                                                      ...f,
                                                      [idea.ideaId]: {
                                                        ...f[idea.ideaId],
                                                        severity: opt.value,
                                                      },
                                                    }))
                                                }
                                                value={opt.value}
                                                aria-label={opt.label}
                                                sx={{
                                                  color: opt.color,
                                                  "&.Mui-checked": {color: opt.color},
                                                }}
                                            />
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                              {opt.icon}
                                              <Typography
                                                  sx={{
                                                    color: opt.color,
                                                    fontWeight: 600,
                                                    fontSize: 16,
                                                  }}
                                              >
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
                                        multiline
                                        minRows={2}
                                        sx={{my: 2, background: "#fff"}}
                                        value={feedback[idea.ideaId]?.comment || ""}
                                        onChange={e =>
                                            setFeedback(f => ({
                                              ...f,
                                              [idea.ideaId]: {
                                                ...f[idea.ideaId],
                                                comment: e.target.value,
                                              },
                                            }))
                                        }
                                    />
                                    <Stack direction="row" gap={2}>
                                      <Button
                                          variant="contained"
                                          color="success"
                                          startIcon={<ThumbUpAlt/>}
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
                                          startIcon={<ThumbDownAlt/>}
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
                                  <div className="idea-feedback-row">
                                    <b>Feedback:</b>
                                    {idea.feedback ? (
                                        <>
                                          {FEEDBACK_ICON_ONLY[idea.feedback.severity]}
                                          <span>{idea.feedback.comment}</span>
                                        </>
                                    ) : (
                                        <span style={{color: "#aaa"}}>No feedback</span>
                                    )}
                                  </div>
                              )}
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </>
  );
}
