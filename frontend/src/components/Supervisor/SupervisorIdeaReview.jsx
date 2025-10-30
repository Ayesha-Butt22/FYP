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
import "./SupervisorIdeaReview.css";

/*
  SupervisorIdeaReview
  - Loads proposals from the server (tries authenticated endpoint first: /api/proposals/my).
    If that fails and there's a supervisor email available in localStorage, it falls back to
    /api/proposals/supervisor/:email.
  - Maps the backend response into the same shape used by the table UI (no layout changes).
  - Shows "You dont have any idea proposal" when no proposals are returned.
  - Maps numeric projectStatus -> UI statuses:
      0 -> Under Review (pending)
      1 -> Accepted      (approved)
      2 -> Rejected      (rejected)
  - Keeps existing Update Status modal and UI styling unchanged.
*/

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

const mapStatusFromNumeric = (n) => {
  // n: 0 -> under review, 1 -> accepted, 2 -> rejected
  switch (Number(n)) {
    case 0:
      return "pending";
    case 1:
      return "approved";
    case 2:
      return "rejected";
    default:
      return "pending";
  }
};

function normalizeProposalsResponse(raw) {
  // raw may be:
  // - an array of proposals (populated groupId)
  // - an object { success: true, count, data: [...] }
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.data && Array.isArray(raw.data)) return raw.data;
  return [];
}

export default function SupervisorIdeaReview() {
  const [ideas, setIdeas] = useState([]); // mapped proposals
  const [expanded, setExpanded] = useState({});
  const [feedback, setFeedback] = useState({});

  // Modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [modalIdeaId, setModalIdeaId] = useState(null);
  const [modalStatus, setModalStatus] = useState("approved");
  const [modalComment, setModalComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [noProposals, setNoProposals] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchForSupervisor = async () => {
      setLoading(true);
      try {
        // First try the authenticated endpoint that uses req.user (your controller getMyProposals)
        let resp = await fetch("/api/proposals/my", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // include cookies if your auth uses them
        });

        // If authenticated endpoint returns unauthorized or not found, and we have an email fallback,
        // try the supervisor-by-email endpoint (some deployments may expose this).
        if (!resp.ok) {
          const storedEmail = localStorage.getItem("email") || "";
          if ((resp.status === 401 || resp.status === 403 || resp.status === 404) && storedEmail) {
            resp = await fetch(`/api/proposals/supervisor/${encodeURIComponent(storedEmail)}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        if (!mounted) return;

        if (resp.ok) {
          const raw = await resp.json();
          const proposals = normalizeProposalsResponse(raw);

          if (!proposals || proposals.length === 0) {
            setIdeas([]);
            setNoProposals(true);
          } else {
            // Map backend proposals to the UI structure (same as DUMMY_IDEAS)
            const mapped = proposals.map((p) => {
              const group = p.groupId || {};
              const members = [];
              if (group.leader) {
                members.push({
                  name: group.leader.name || group.leader.email || group.leader.studentId || group.leader.sapId || "Leader",
                  sapId: group.leader.studentId || group.leader.sapId || "",
                });
              }
              if (group.member2) {
                members.push({
                  name: group.member2.name || group.member2.email || group.member2.studentId || group.member2.sapId || "Member 2",
                  sapId: group.member2.studentId || group.member2.sapId || "",
                });
              }
              if (group.member3) {
                members.push({
                  name: group.member3.name || group.member3.email || group.member3.studentId || group.member3.sapId || "Member 3",
                  sapId: group.member3.studentId || group.member3.sapId || "",
                });
              }

              return {
                // ideaId: use proposal _id for uniqueness, but fallback to group._id or group.groupId
                ideaId: p._id || group._id || group.groupId || Math.random().toString(36).slice(2),
                groupName: group.groupId || (group._id ? String(group._id) : "Group"),
                title: p.projectTitle || "",
                status: mapStatusFromNumeric(p.projectStatus),
                abstract: p.projectTitle || "",
                methodology: p.projectDescription || "",
                tools: p.projectTools || "",
                domain: p.specialization || p.speciality || "",
                members,
                feedback: p.projectSupervisorComments
                  ? { severity: Number(p.projectStatus) === 1 ? "✅" : Number(p.projectStatus) === 2 ? "❌" : "⚠️", comment: p.projectSupervisorComments }
                  : null,
              };
            });

            setIdeas(mapped);
            setNoProposals(false);
          }
        } else {
          // not ok and no fallback data -> treat as no proposals to preserve UI
          setIdeas([]);
          setNoProposals(true);
        }
      } catch (err) {
        console.error("Error loading proposals:", err);
        setIdeas([]);
        setNoProposals(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchForSupervisor();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // keep feedback fields present (no UI change)
    setIdeas((prev) => prev.map((i) => ({ feedback: i.feedback || null, ...i })));
  }, []);

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

  const handleModalSave = () => {
    if (!modalIdeaId) return;
    const newFeedback = {
      severity: modalStatus === "approved" ? "✅" : "❌",
      comment: modalComment.trim(),
    };

    setIdeas((old) =>
      old.map((idea) =>
        idea.ideaId === modalIdeaId
          ? {
              ...idea,
              status: modalStatus,
              feedback: newFeedback,
            }
          : idea
      )
    );

    setFeedback((f) => {
      const copy = { ...f };
      delete copy[modalIdeaId];
      return copy;
    });

    // TODO: optionally POST update to server here
    closeStatusModal();
  };

  const handleReviewInline = (ideaId, status) => {
    const fb = feedback[ideaId];
    setIdeas((old) =>
      old.map((idea) =>
        idea.ideaId === ideaId
          ? {
              ...idea,
              status,
              feedback: {
                severity: fb?.severity,
                comment: fb?.comment,
              },
            }
          : idea
      )
    );
    setFeedback((f) => {
      const copy = { ...f };
      delete copy[ideaId];
      return copy;
    });
  };

  return (
    <>
      <DashboardSectionHeader description="Here you can review FYP group ideas and proposals. Use Update Status for pending groups (modal).">
        FYP Idea & Proposal Review
      </DashboardSectionHeader>

      <Box maxWidth={1500} mx="auto" my={4}>
        <Box className="review-table-box">
          {!loading && noProposals ? (
            <Box sx={{ py: 8, textAlign: "center", color: "#666" }}>
              <Typography variant="h6">You dont have any idea proposal</Typography>
            </Box>
          ) : (
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
                      <TableRow hover className="review-table-row" sx={idea.status === "pending" ? { backgroundColor: "#fff9e6" } : {}}>
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
                              fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
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
                                  "&:active": {
                                    bgcolor: "#ffffff",
                                    color: "#01337a",
                                  },
                                  "&:focus-visible": {
                                    outline: "3px solid rgba(1,51,122,0.18)",
                                    outlineOffset: "2px",
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
                              aria-label={isExpanded ? "Hide Details" : "Show Details"}
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
                                    <span className="member-name">{m.name}</span>
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
          )}
        </Box>
      </Box>

      {/* Modal for updating status + feedback */}
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
          <RadioGroup row value={modalStatus} onChange={(e) => setModalStatus(e.target.value)} sx={{ mb: 2 }}>
            <FormControlLabel value="approved" control={<Radio sx={{ "&.Mui-checked": { color: "#219653" } }} />} label="Approve" />
            <FormControlLabel value="rejected" control={<Radio sx={{ "&.Mui-checked": { color: "#e74c3c" } }} />} label="Reject" />
          </RadioGroup>

          <Typography sx={{ mb: 1, fontWeight: 700 }}>Feedback</Typography>
          <TextField placeholder="Write feedback for the students..." fullWidth multiline minRows={3} value={modalComment} onChange={(e) => setModalComment(e.target.value)} sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={closeStatusModal}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleModalSave()}
              disabled={!modalStatus || !modalComment.trim()}
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