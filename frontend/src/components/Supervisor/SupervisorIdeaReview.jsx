import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Collapse,
  IconButton,
  Chip,
  Tooltip,
  Stack,
  TextField,
  Button,
  Radio,
  Typography,
  Modal,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import {
  GroupOutlined,
  ExpandMore,
  ExpandLess,
  CheckCircleOutline,
  HourglassEmptyOutlined,
  CancelOutlined,
  WarningAmber,
} from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService.jsx";
import "./SupervisorIdeaReview.css";

const STATUS = {
  approved: {
    label: "Accepted",
    icon: <CheckCircleOutline style={{ color: "#219653" }} />,
    chipStyle: {
      backgroundColor: "#e9fbf0",
      color: "#219653",
      border: "1.5px solid #b7eccb",
      fontWeight: 700,
    },
  },
  pending: {
    label: "Under Review",
    icon: <HourglassEmptyOutlined style={{ color: "#f2994a" }} />,
    chipStyle: {
      backgroundColor: "#fff7de",
      color: "#b97b16",
      border: "1.5px solid #ffe6b2",
      fontWeight: 700,
    },
  },
  rejected: {
    label: "Rejected",
    icon: <CancelOutlined style={{ color: "#e74c3c" }} />,
    chipStyle: {
      backgroundColor: "#ffeaea",
      color: "#e74c3c",
      border: "1.5px solid #ffb7b7",
      fontWeight: 700,
    },
  },
};

const FEEDBACK_ICON_ONLY = {
  "❌": <CancelOutlined sx={{ color: "#e74c3c", fontSize: 23, mr: 1 }} />,
  "✅": <CheckCircleOutline sx={{ color: "#219653", fontSize: 23, mr: 1 }} />,
  "⚠️": <WarningAmber sx={{ color: "#f2994a", fontSize: 23, mr: 1 }} />,
};

export default function SupervisorIdeaReview() {
  const [ideas, setIdeas] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [modalIdeaId, setModalIdeaId] = useState(null);
  const [modalStatus, setModalStatus] = useState("approved");
  const [modalComment, setModalComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const thStyle = {
    fontWeight: 800,
    fontSize: 22,
    color: "#01337a",
    background: "#f4f6fa",
    fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
  };
  const tdStyle = {
    fontSize: 20,
    color: "#22223b",
    fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
  };

  // Helper: derive a readable name from email if name missing
  const emailToName = (email) => {
    if (!email || typeof email !== "string") return "";
    const local = email.split("@")[0] || "";
    // split by dot/underscore/hyphen and capitalize parts
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length === 0) return local;
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  };

  // ✅ Fetch proposals for supervisor
  useEffect(() => {
    let mounted = true;
    const fetchMyProposals = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const token = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const resp = await fetch("http://localhost:5000/api/proposals/supervisor", {
          method: "GET",
          headers,
        });

        if (!mounted) return;
        if (resp.ok) {
          const json = await resp.json();
          const proposals = Array.isArray(json.data) ? json.data : [];
          if (!proposals.length) {
            setIdeas([]);
            setLoading(false);
            return;
          }

          const mapped = proposals.map((p) => {
            const projStatus = Number(p.projectStatus || 0);
            const statusKey =
              projStatus === 1 ? "approved" : projStatus === 2 ? "rejected" : "pending";

            const g = p.groupId || {};
            const members = [];
            // Build member objects to include name, email and sapId (fallbacks)
            if (g.leader) {
              const leader = g.leader;
              const name = leader.name || emailToName(leader.email) || leader.sapId || leader.studentId || "Leader";
              members.push({
                name,
                email: leader.email || "",
                sapId: leader.sapId || leader.studentId || "",
              });
            }
            if (g.member2) {
              const m2 = g.member2;
              const name = m2.name || emailToName(m2.email) || m2.sapId || m2.studentId || "Member 2";
              members.push({
                name,
                email: m2.email || "",
                sapId: m2.sapId || m2.studentId || "",
              });
            }
            if (g.member3) {
              const m3 = g.member3;
              const name = m3.name || emailToName(m3.email) || m3.sapId || m3.studentId || "Member 3";
              members.push({
                name,
                email: m3.email || "",
                sapId: m3.sapId || m3.studentId || "",
              });
            }

            return {
              ideaId: p._id,
              groupName: g.groupId || "Group",
              title: p.projectTitle || "Untitled",
              abstract: p.projectDescription || "",
              methodology: p.projectTools || "",
              tools: p.projectTools || "",
              domain: p.specialization || "",
              status: statusKey,
              members,
              feedback: p.projectSupervisorComments
                ? {
                    severity: projStatus === 1 ? "✅" : projStatus === 2 ? "❌" : "⚠️",
                    comment: p.projectSupervisorComments,
                  }
                : null,
            };
          });

          setIdeas(mapped);
        } else {
          if (resp.status === 404) {
            setIdeas([]);
          } else {
            const err = await resp.json().catch(() => ({}));
            setLoadError(err.error || "Failed to load proposals");
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setLoadError("Network or authorization error");
      } finally {
        setLoading(false);
      }
    };
    fetchMyProposals();
    return () => (mounted = false);
  }, []);

  const openStatusModal = (ideaId) => {
    setModalIdeaId(ideaId);
    setModalStatus("approved");
    setModalComment("");
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setModalIdeaId(null);
    setModalComment("");
  };

  // ✅ Save updated status via backend + toast
  const handleModalSave = async () => {
    if (!modalIdeaId) return;
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const statusCode = modalStatus === "approved" ? 1 : 2;
      const resp = await fetch(
        `http://localhost:5000/api/proposals/${modalIdeaId}/review`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            projectStatus: statusCode,
            projectSupervisorComments: modalComment.trim(),
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toastService.error(err.error || "Failed to update proposal.");
        return;
      }

      // Update UI instantly
      const newFeedback = {
        severity: modalStatus === "approved" ? "✅" : "❌",
        comment: modalComment.trim(),
      };
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.ideaId === modalIdeaId
            ? { ...idea, status: modalStatus, feedback: newFeedback }
            : idea
        )
      );

      toastService.success("Proposal reviewed successfully!");
      closeStatusModal();
    } catch (err) {
      console.error("Error updating proposal:", err);
      toastService.error("Network error while reviewing proposal.");
    }
  };

  if (loading) {
    return (
      <>
        <DashboardSectionHeader description="Here you can review FYP group ideas and proposals. Use Update Status for pending groups (modal).">
          FYP Idea & Proposal Review
        </DashboardSectionHeader>
        <Box display="flex" justifyContent="center" sx={{ mt: 6 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <DashboardSectionHeader description="Here you can review FYP group ideas and proposals. Use Update Status for pending groups (modal).">
        FYP Idea & Proposal Review
      </DashboardSectionHeader>

      <Box maxWidth={1500} mx="auto" my={4}>
        {loadError ? (
          <Box sx={{ color: "error.main", textAlign: "center", py: 6 }}>{loadError}</Box>
        ) : ideas.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "#666" }}>
            You don't have any idea proposal
          </Box>
        ) : (
          <Box className="review-table-box">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={thStyle}>
                    <GroupOutlined sx={{ verticalAlign: "middle", color: "white", mr: 1, fontSize: 28 }} />
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
                {ideas.map((idea) => {
                  const isExpanded = expanded[idea.ideaId];
                  const status = STATUS[idea.status] || STATUS.pending;
                  return (
                    <React.Fragment key={idea.ideaId}>
                      <TableRow
                        hover
                        className="review-table-row"
                        sx={idea.status === "pending" ? { backgroundColor: "#fff9e6" } : {}}
                      >
                        <TableCell sx={tdStyle}>
                          <Stack direction="row" gap={1.5} alignItems="center">
                            <Typography fontWeight={700} fontSize={20}>
                              {idea.groupName}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell sx={tdStyle}>
                          <Tooltip title={idea.title}>
                            <Typography
                              fontWeight={600}
                              color="#01337a"
                              sx={{ cursor: "pointer", fontSize: 20 }}
                              onClick={() =>
                                setExpanded((exp) => ({
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
                              fontSize: 17,
                              height: 36,
                              minWidth: 130,
                              justifyContent: "left",
                            }}
                          />
                        </TableCell>

                        <TableCell sx={tdStyle} align="center">
                          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                            {idea.status === "pending" && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => openStatusModal(idea.ideaId)}
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: "#01337a",
                                  color: "#ffffff",
                                  textTransform: "none",
                                  border: "1px solid #01337a",
                                  "&:hover": {
                                    bgcolor: "#ffffff",
                                    color: "#01337a",
                                    border: "1px solid #01337a",
                                  },
                                }}
                              >
                                Update Status
                              </Button>
                            )}
                            <IconButton
                              color="primary"
                              onClick={() =>
                                setExpanded((exp) => ({
                                  ...exp,
                                  [idea.ideaId]: !exp[idea.ideaId],
                                }))
                              }
                            >
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={4} className="review-table-collapse-cell">
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box className="idea-details-box">
                              <Box className="idea-details-section">
                                <div className="idea-detail-row">
                                  <span className="idea-detail-label">Project Title:</span>
                                  <span className="idea-detail-value">{idea.abstract}</span>
                                </div>
                                <div className="idea-detail-row">
                                  <span className="idea-detail-label">Project Description:</span>
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
                                <span className="idea-detail-label" style={{ marginBottom: 5 }}>
                                  Members:
                                </span>
                                {idea.members.map((m, midx) => (
                                  <div className="member-row-enhanced" key={midx}>
                                    <div>
                                      <span className="member-name">{m.name}</span>
                                      {m.email ? (
                                        <div className="member-email" style={{ fontSize: 13, color: "#666" }}>
                                          {m.email}
                                        </div>
                                      ) : null}
                                    </div>
                                    <span className="member-sapid" style={{ marginLeft: 8 }}>
                                      {m.sapId}
                                    </span>
                                  </div>
                                ))}
                              </Box>
                            </Box>

                            {idea.status !== "pending" ? (
                              <div className="idea-feedback-row">
                                <b>Feedback:</b>
                                {idea.feedback ? (
                                  <>
                                    {FEEDBACK_ICON_ONLY[idea.feedback.severity]}
                                    <span>{idea.feedback.comment}</span>
                                  </>
                                ) : (
                                  <span style={{ color: "#aaa" }}>No feedback</span>
                                )}
                              </div>
                            ) : null}
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>

      {/* ✅ Modal for update status */}
      <Modal open={statusModalOpen} onClose={closeStatusModal} aria-labelledby="update-status-modal">
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "92%", sm: 520 },
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
          }}
        >
          <Typography id="update-status-modal" variant="h6" sx={{ mb: 2, color: "#01337a", fontWeight: 800 }}>
            Update Group Status
          </Typography>

          <Typography sx={{ mb: 1, fontWeight: 700 }}>Select Status</Typography>
          <RadioGroup
            row
            value={modalStatus}
            onChange={(e) => setModalStatus(e.target.value)}
            sx={{ mb: 2 }}
          >
            <FormControlLabel
              value="approved"
              control={<Radio sx={{ "&.Mui-checked": { color: "#219653" } }} />}
              label="Approve"
            />
            <FormControlLabel
              value="rejected"
              control={<Radio sx={{ "&.Mui-checked": { color: "#e74c3c" } }} />}
              label="Reject"
            />
          </RadioGroup>

          <Typography sx={{ mb: 1, fontWeight: 700 }}>Feedback</Typography>
          <TextField
            placeholder="Write feedback for the students..."
            fullWidth
            multiline
            minRows={3}
            value={modalComment}
            onChange={(e) => setModalComment(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={closeStatusModal}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleModalSave}
              disabled={!modalComment.trim()}
              sx={{
                bgcolor: "#01337a",
                color: "#fff",
                textTransform: "none",
                "&:hover": { bgcolor: "#012a4a" },
              }}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}