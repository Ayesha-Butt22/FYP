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
import "./SupervisorIdeaReview.css";

/*
  SupervisorIdeaReview — updated:
  - Fetches proposals for the logged-in supervisor via API in useEffect.
  - Maps API response to the same shape used by the table UI so design is unchanged.
  - If API returns no proposals, shows the "You don't have any idea proposal" message in place of the table.
  - Maps numeric projectStatus -> labels:
      0 => Under Review
      1 => Accepted
      2 => Rejected
  - Preserves UI and button styling exactly as before.
*/

const STATUS = {
  approved: {
    label: "Accepted", // mapped from backend status 1
    icon: <CheckCircleOutline style={{ color: "#219653" }} />,
    chipStyle: {
      backgroundColor: "#e9fbf0",
      color: "#219653",
      border: "1.5px solid #b7eccb",
      fontWeight: 700,
    },
  },
  pending: {
    label: "Under Review", // mapped from backend status 0
    icon: <HourglassEmptyOutlined style={{ color: "#f2994a" }} />,
    chipStyle: {
      backgroundColor: "#fff7de",
      color: "#b97b16",
      border: "1.5px solid #ffe6b2",
      fontWeight: 700,
    },
  },
  rejected: {
    label: "Rejected", // mapped from backend status 2
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
  const [ideas, setIdeas] = useState([]); // will be populated from API
  const [expanded, setExpanded] = useState({});
  const [feedback, setFeedback] = useState({});

  // Modal state
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

  useEffect(() => {
    let mounted = true;

    const fetchMyProposals = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        // If you store auth token in localStorage, include it; otherwise backend must accept session cookie
        const token = localStorage.getItem("token"); // adjust key if different
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Call the supervisor proposals endpoint (protected).
        // The backend obtains supervisor email from req.user, but we still include token if available.
        const resp = await fetch("http://localhost:5000/api/proposals/supervisor", {
          method: "GET",
          headers,
        });

        if (!mounted) return;

        if (resp.ok) {
          const json = await resp.json();
          // Expecting { success: true, count, data: [...] } as controller sends
          const proposals = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
          if (!proposals || proposals.length === 0) {
            // no proposals -> show message in place of table
            setIdeas([]);
            setLoading(false);
            return;
          }

          // Map proposals to the UI shape used by the static DUMMY_IDEAS above
          const mapped = proposals.map((p) => {
            const projStatus = Number(p.projectStatus ?? p.projectStatus === 0 ? p.projectStatus : p.projectStatus) || 0;
            // map numeric to our internal status keys
            const statusKey = projStatus === 1 ? "approved" : projStatus === 2 ? "rejected" : "pending";

            // group info may be populated object (p.groupId)
            const groupObj = p.groupId || {};
            // Build members array from populated leader/member2/member3 if available
            const members = [];
            if (groupObj.leader) {
              members.push({
                name: groupObj.leader.name || groupObj.leader.email || "Leader",
                sapId: groupObj.leader.sapId || groupObj.leader.studentId || "",
              });
            }
            if (groupObj.member2) {
              members.push({
                name: groupObj.member2.name || groupObj.member2.email || "Member",
                sapId: groupObj.member2.sapId || groupObj.member2.studentId || "",
              });
            }
            if (groupObj.member3) {
              members.push({
                name: groupObj.member3.name || groupObj.member3.email || "Member",
                sapId: groupObj.member3.sapId || groupObj.member3.studentId || "",
              });
            }

            const mappedIdea = {
              ideaId: p._id || (groupObj._id || "") + "-proposal",
              groupName: groupObj.groupId || groupObj.groupCode || (groupObj._id ? String(groupObj._id).slice(-6) : "Group"),
              title: p.projectTitle || "Untitled",
              status: statusKey,
              abstract: p.projectDescription || "",
              methodology: p.projectTools || "",
              tools: p.projectTools || "",
              domain: p.specialization || p.domain || "",
              members,
              feedback: p.projectSupervisorComments ? { severity: projStatus === 1 ? "✅" : projStatus === 2 ? "❌" : "⚠️", comment: p.projectSupervisorComments } : null,
            };

            return mappedIdea;
          });

          setIdeas(mapped);
          setLoading(false);
        } else {
          // Non-ok responses
          if (resp.status === 404) {
            setIdeas([]); // no proposals
            setLoading(false);
            return;
          }
          const err = await resp.json().catch(() => ({ error: `Status ${resp.status}` }));
          setLoadError(err.error || `Failed to load proposals (${resp.status})`);
          setIdeas([]);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch proposals:", err);
        setLoadError("Failed to load proposals. Please check network/authorization.");
        setIdeas([]);
        setLoading(false);
      }
    };

    fetchMyProposals();

    return () => {
      mounted = false;
    };
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

  // If still loading, show spinner in place of table
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
                  <TableCell sx={thStyle} align="center">Action</TableCell>
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
                            <Typography fontWeight={700} fontSize={20}>{idea.groupName}</Typography>
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
                                <span className="idea-detail-label" style={{ marginBottom: 5 }}>Members:</span>
                                {idea.members.map((m, midx) => (
                                  <div className="member-row-enhanced" key={midx}>
                                    <span className="member-name">{m.name}</span>
                                    <span className="member-sapid" style={{ marginLeft: 8 }}>{m.sapId}</span>
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

      {/* Modal for updating status + feedback */}
      <Modal open={statusModalOpen} onClose={closeStatusModal} aria-labelledby="update-status-modal">
        <Box sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "92%", sm: 520 },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 3,
        }}>
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
            <FormControlLabel value="approved" control={<Radio sx={{ "&.Mui-checked": { color: "#219653" } }} />} label="Approve" />
            <FormControlLabel value="rejected" control={<Radio sx={{ "&.Mui-checked": { color: "#e74c3c" } }} />} label="Reject" />
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
            <Button variant="outlined" onClick={closeStatusModal}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => handleModalSave()}
              disabled={!modalStatus || !modalComment.trim()}
              sx={{
                bgcolor: "#01337a", color: "#fff", textTransform: "none",
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