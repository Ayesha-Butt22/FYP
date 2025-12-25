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
  Stack,
  Button,
  Radio,
  Typography,
  Modal,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  TextField,
  Tooltip,
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
import {
  fetchSupervisorProposals,
  updateProposalStatus,
  fetchPendingProposals,
} from "../Api/Proposals/supervisorReviewApi.jsx";
import "./SupervisorIdeaReview.css";

const STATUS_CONFIG = {
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

const FEEDBACK_ICONS = {
  "❌": <CancelOutlined sx={{ color: "#e74c3c", fontSize: 23, mr: 1 }} />,
  "✅": <CheckCircleOutline sx={{ color: "#219653", fontSize: 23, mr: 1 }} />,
  "⚠️": <WarningAmber sx={{ color: "#f2994a", fontSize: 23, mr: 1 }} />,
};

const TABLE_STYLES = {
  header: { fontWeight: 800, fontSize: 22, color: "#01337a", background: "#f4f6fa", fontFamily: "'Inter', 'Roboto', Arial, sans-serif" },
  cell: { fontSize: 20, color: "#22223b", fontFamily: "'Inter', 'Roboto', Arial, sans-serif" },
};

const getStatusKey = (projectStatus) => {
  const status = Number(projectStatus || 0);
  if (status === 1) return "approved";
  if (status === 2) return "rejected";
  return "pending";
};

const getFeedbackSeverity = (projectStatus) => {
  const status = Number(projectStatus || 0);
  if (status === 1) return "✅";
  if (status === 2) return "❌";
  return "⚠️";
};

const extractMemberInfo = (member, defaultName) => {
  if (!member) return null;
  return {
    name: member.name || member.sapId || member.studentId || defaultName,
    email: member.email || "",
    sapId: member.sapId || member.studentId || "",
  };
};

const mapProposalToIdea = (proposal) => {
  const projectStatus = Number(proposal.projectStatus || 0);
  const statusKey = getStatusKey(projectStatus);
  const group = proposal.groupId || {};

  const members = [
    extractMemberInfo(group.leader, "Leader"),
    extractMemberInfo(group.member2, "Member 2"),
    extractMemberInfo(group.member3, "Member 3"),
  ].filter(Boolean);

  // createdAt might be string or Date in server response
  const createdAt = proposal.createdAt ? new Date(proposal.createdAt) : null;

  return {
    ideaId: proposal._id,
    groupName: group.groupId || "Group",
    title: proposal.projectTitle || "Untitled",
    abstract: proposal.projectTitle || "",
    methodology: proposal.projectDescription || "",
    tools: proposal.projectTools || "",
    domain: proposal.projectSpecialization || "",
    status: statusKey,
    members,
    createdAt: createdAt ? createdAt.toISOString() : null,
    feedback: proposal.projectSupervisorComments
      ? { severity: getFeedbackSeverity(projectStatus), comment: proposal.projectSupervisorComments }
      : null,
  };
};

const maskGroupLabel = (groupName) => {
  if (!groupName) return "";
  const s = String(groupName);
  const m = s.match(/^([^\d]*?)(\d{1,})$/);
  if (m) return `${m[1] || "group-"}${m[2].slice(-5)}`;
  return `group-${s.slice(-5)}`;
};

export default function SupervisorIdeaReview() {
  const [ideas, setIdeas] = useState([]);
  const [pendingIdeas, setPendingIdeas] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [modalIdeaId, setModalIdeaId] = useState(null);
  const [modalStatus, setModalStatus] = useState("approved");
  const [modalComment, setModalComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [timerCountdowns, setTimerCountdowns] = useState({});

  useEffect(() => {
    let mounted = true;

    const loadAllProposals = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const supervisorProposals = await fetchSupervisorProposals();
        const mappedSupervisor = supervisorProposals.map(mapProposalToIdea);
        if (!mounted) return;
        setIdeas(mappedSupervisor);
      } catch (err) {
        console.error("[SupervisorIdeaReview] Load proposals error:", err);
        if (mounted) setLoadError(err.message || "Failed to load proposals");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const loadPending = async () => {
      try {
        const pending = await fetchPendingProposals(); // raw proposals from server
        if (!mounted) return;

        // map for UI display
        setPendingIdeas(pending.map(mapProposalToIdea));

        // prepare countdowns keyed by proposal._id
        const now = new Date();
        const countdowns = {};
        pending.forEach((p) => {
          const created = p.createdAt ? new Date(p.createdAt) : null;
          if (created) {
            const deadline = new Date(created.getTime() + 16 * 60 * 60 * 1000); // 16 hours after creation
            countdowns[p._id] = Math.max(deadline - now, 0);
          } else {
            countdowns[p._id] = 0;
          }
        });
        setTimerCountdowns(countdowns);

        // --- ADDED TOAST NOTICE (after pending load and countdown logic) ---
        // Show info toast to supervisor to review FYP ideas if there are pending proposals.
        if (Array.isArray(pending) && pending.length > 0) {
          toastService.info("Kindly review the FYP idea");
        }
        // -------------------------------------------------------------------
      } catch (err) {
        console.error("[SupervisorIdeaReview] Fetch pending error:", err);
      }
    };

    loadAllProposals();
    loadPending();

    // ticker to decrement countdowns every second
    const interval = setInterval(() => {
      setTimerCountdowns((prev) => {
        const updated = {};
        Object.keys(prev).forEach((key) => {
          updated[key] = Math.max(prev[key] - 1000, 0);
        });
        return updated;
      });
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const toggleExpanded = (ideaId) => {
    setExpanded((prev) => ({ ...prev, [ideaId]: !prev[ideaId] }));
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

  const handleModalSave = async () => {
    if (!modalIdeaId) return;

    try {
      const statusCode = modalStatus === "approved" ? 1 : 2;
      await updateProposalStatus(modalIdeaId, statusCode, modalComment.trim());

      const newFeedback = { severity: modalStatus === "approved" ? "✅" : "❌", comment: modalComment.trim() };

      // update in both ideas and pendingIdeas arrays
      setIdeas((prev) => prev.map((idea) => (idea.ideaId === modalIdeaId ? { ...idea, status: modalStatus, feedback: newFeedback } : idea)));
      setPendingIdeas((prev) => prev.map((idea) => (idea.ideaId === modalIdeaId ? { ...idea, status: modalStatus, feedback: newFeedback } : idea)));

      toastService.success("Proposal reviewed successfully!");
      closeStatusModal();
    } catch (err) {
      console.error("[SupervisorIdeaReview] Update status error:", err);
      toastService.error(err.message || "Failed to update proposal status");
    }
  };

  if (loading) {
    return (
      <>
        <DashboardSectionHeader description="Here you can review FYP group ideas and proposals.">
          FYP Idea & Proposal Review
        </DashboardSectionHeader>
        <Box display="flex" justifyContent="center" sx={{ mt: 6 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  // combined list — pending first (to show timers), then other proposals
  const combinedIdeas = [...pendingIdeas, ...ideas.filter(a => !pendingIdeas.some(p => p.ideaId === a.ideaId))];

  return (
    <>
      <DashboardSectionHeader description="Here you can review FYP group ideas and proposals. Pending proposals show a countdown timer.">
        FYP Idea & Proposal Review
      </DashboardSectionHeader>

      <Box maxWidth={1500} mx="auto" my={4}>
        {loadError ? (
          <ErrorMessage message={loadError} />
        ) : combinedIdeas.length === 0 ? (
          <EmptyState />
        ) : (
          <ProposalTable
            ideas={combinedIdeas}
            expanded={expanded}
            onToggleExpanded={toggleExpanded}
            onOpenStatusModal={openStatusModal}
            timerCountdowns={timerCountdowns}
          />
        )}
      </Box>

      <StatusUpdateModal
        open={statusModalOpen}
        status={modalStatus}
        comment={modalComment}
        onClose={closeStatusModal}
        onStatusChange={setModalStatus}
        onCommentChange={setModalComment}
        onSave={handleModalSave}
      />
    </>
  );
}

// Sub-components
const ErrorMessage = ({ message }) => <Box sx={{ color: "error.main", textAlign: "center", py: 6 }}>{message}</Box>;
const EmptyState = () => <Box sx={{ textAlign: "center", py: 8, color: "#666" }}>You don't have any idea proposals</Box>;

const ProposalTable = ({ ideas, expanded, onToggleExpanded, onOpenStatusModal, timerCountdowns }) => (
  <Box className="review-table-box">
    <Table>
      <TableHead>
        <TableRow>
          <TableCell sx={TABLE_STYLES.header}>
            <GroupOutlined sx={{ verticalAlign: "middle", color: "white", mr: 1, fontSize: 28 }} /> Group
          </TableCell>
          <TableCell sx={TABLE_STYLES.header}>Title</TableCell>
          <TableCell sx={TABLE_STYLES.header}>Status / Timer</TableCell>
          <TableCell sx={TABLE_STYLES.header} align="center">
            Action
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {ideas.map((idea) => (
          <ProposalRow
            key={idea.ideaId}
            idea={idea}
            isExpanded={expanded[idea.ideaId]}
            onToggleExpanded={onToggleExpanded}
            onOpenStatusModal={onOpenStatusModal}
            timerCountdowns={timerCountdowns}
          />
        ))}
      </TableBody>
    </Table>
  </Box>
);

const ProposalRow = ({ idea, isExpanded, onToggleExpanded, onOpenStatusModal, timerCountdowns }) => {
  const status = STATUS_CONFIG[idea.status] || STATUS_CONFIG.pending;
  const remaining = timerCountdowns[idea.ideaId];

  const formatCountdown = (ms) => {
    if (ms === undefined) return "-";
    if (ms <= 0) return "Expired";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  return (
    <>
      <TableRow hover className="review-table-row" sx={idea.status === "pending" ? { backgroundColor: "#fff9e6" } : {}}>
        <TableCell sx={TABLE_STYLES.cell}>
          <Stack direction="row" gap={1.5} alignItems="center">
            <Typography fontWeight={700} fontSize={20}>{maskGroupLabel(idea.groupName)}</Typography>
          </Stack>
        </TableCell>

        <TableCell sx={TABLE_STYLES.cell}>
          <Tooltip title={idea.title}>
            <Typography fontWeight={600} color="#01337a" sx={{ cursor: "pointer", fontSize: 20 }} onClick={() => onToggleExpanded(idea.ideaId)}>
              {idea.title}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell sx={TABLE_STYLES.cell}>
          <Chip icon={status.icon} label={status.label} sx={{ px: 1.5, ...status.chipStyle, borderRadius: 25, fontWeight: 700, fontSize: 17, height: 36, minWidth: 130, justifyContent: "left" }} />
          {idea.status === "pending" && (
            <Typography sx={{ mt: 0.5, fontSize: 16, color: "#f2994a" }}>
              Time left: {formatCountdown(remaining)}
            </Typography>
          )}
        </TableCell>

        <TableCell sx={TABLE_STYLES.cell} align="center">
          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
            {idea.status === "pending" && (
              <Button variant="contained" size="small" onClick={() => onOpenStatusModal(idea.ideaId)}
                sx={{ fontWeight: 700, bgcolor: "#01337a", color: "#ffffff", textTransform: "none", border: "1px solid #01337a",
                  "&:hover": { bgcolor: "#ffffff", color: "#01337a", border: "1px solid #01337a" } }}>
                Update Status
              </Button>
            )}
            <IconButton color="primary" onClick={() => onToggleExpanded(idea.ideaId)}>
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={4} className="review-table-collapse-cell">
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <ProposalDetails idea={idea} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const ProposalDetails = ({ idea }) => (
  <Box className="idea-details-box">
    <Box className="idea-details-section">
      <DetailRow label="Project Desc" value={idea.methodology} />
      <DetailRow label="Tools" value={idea.tools} />
      <DetailRow label="Domain" value={idea.domain} />
      {idea.status !== "pending" && <FeedbackSection feedback={idea.feedback} />}
      {idea.status === "pending" && idea.createdAt && (
        <Box sx={{ mt: 2 }}>
          <strong>Created:</strong> {new Date(idea.createdAt).toLocaleString()}
        </Box>
      )}
    </Box>
    <MembersSection members={idea.members} />
  </Box>
);

const DetailRow = ({ label, value }) => (
  <div className="idea-detail-row">
    <span className="idea-detail-label">{label}:</span>
    <span className="idea-detail-value">{value}</span>
  </div>
);

const MembersSection = ({ members }) => (
  <Box className="members-section-align">
    <span className="idea-detail-label" style={{ marginBottom: 5 }}>Members:</span>
    {members.map((member, idx) => (
      <div className="member-row-enhanced" key={idx}>
        <div>
          <span className="member-name-idea">{member.name}</span>
          {member.email && <div className="member-email" style={{ fontSize: 20, color: "#000000" }}>{member.email}</div>}
        </div>
        <span className="member-sapid" style={{ marginLeft: 8 }}>{member.sapId}</span>
      </div>
    ))}
  </Box>
);

const FeedbackSection = ({ feedback }) => (
  <div className="idea-feedback-row">
    <label>Feedback:</label>
    {feedback ? (<>{FEEDBACK_ICONS[feedback.severity]}<span style={{ fontSize: 25 }}>{feedback.comment}</span></>) : (<span style={{ color: "#aaa" }}>No feedback</span>)}
  </div>
);

const StatusUpdateModal = ({ open, status, comment, onClose, onStatusChange, onCommentChange, onSave }) => (
  <Modal open={open} onClose={onClose} aria-labelledby="update-status-modal">
    <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: { xs: "92%", sm: 520 }, bgcolor: "background.paper", borderRadius: 2, boxShadow: 24, p: 3 }}>
      <Typography id="update-status-modal" variant="h6" sx={{ mb: 2, color: "#01337a", fontWeight: 800 }}>Update Group Status</Typography>

      <Typography sx={{ mb: 1, fontWeight: 700 }}>Select Status</Typography>
      <RadioGroup row value={status} onChange={(e) => onStatusChange(e.target.value)} sx={{ mb: 2 }}>
        <FormControlLabel value="approved" control={<Radio sx={{ "&.Mui-checked": { color: "#219653" } }} />} label="Approve" />
        <FormControlLabel value="rejected" control={<Radio sx={{ "&.Mui-checked": { color: "#e74c3c" } }} />} label="Reject" />
      </RadioGroup>

      <Typography sx={{ mb: 1, fontWeight: 700 }}>Feedback</Typography>
      <TextField placeholder="Write feedback for the students..." fullWidth multiline minRows={3} value={comment} onChange={(e) => onCommentChange(e.target.value)} sx={{ mb: 2 }} />

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
        <Button onClick={onClose} variant="outlined" sx={{ color: "#01337a", borderColor: "#01337a" }}>Cancel</Button>
        <Button onClick={onSave} variant="contained" sx={{ bgcolor: "#01337a", color: "#ffffff" }}>Save</Button>
      </Box>
    </Box>
  </Modal>
);