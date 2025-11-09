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
import {
  fetchSupervisorProposals,
  updateProposalStatus,
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
  header: {
    fontWeight: 800,
    fontSize: 22,
    color: "#01337a",
    background: "#f4f6fa",
    fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
  },
  cell: {
    fontSize: 20,
    color: "#22223b",
    fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
  },
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
    name:
      member.name ||
      member.sapId ||
      member.studentId ||
      defaultName,
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
    feedback: proposal.projectSupervisorComments
      ? {
          severity: getFeedbackSeverity(projectStatus),
          comment: proposal.projectSupervisorComments,
        }
      : null,
  };
};

/**
 * Mask group label to show only the last 5 characters.
 * Examples:
 *  - "group-1761918961210" -> "61210"
 *  - "abc123" -> "bc123" (last 5)
 *  - If input shorter than or equal to 5, show it as-is.
 */
const maskGroupLabel = (groupName) => {
  if (!groupName) return "";
  const s = String(groupName);
  if (s.length <= 5) return s;
  return s.slice(-5);
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

  useEffect(() => {
    let mounted = true;

    const loadProposals = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const proposals = await fetchSupervisorProposals();

        if (!mounted) return;

        if (!Array.isArray(proposals) || proposals.length === 0) {
          setIdeas([]);
        } else {
          const mappedIdeas = proposals.map(mapProposalToIdea);
          setIdeas(mappedIdeas);
        }
      } catch (error) {
        console.error("[SupervisorIdeaReview] Load proposals error:", error);
        if (mounted) {
          setLoadError(error.message || "Network or authorization error");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProposals();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleExpanded = (ideaId) => {
    setExpanded((prev) => ({
      ...prev,
      [ideaId]: !prev[ideaId],
    }));
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

      const newFeedback = {
        severity: modalStatus === "approved" ? "✅" : "❌",
        comment: modalComment.trim(),
      };

      setIdeas((prev) =>
        prev.map((idea) =>
          idea.ideaId === modalIdeaId ? { ...idea, status: modalStatus, feedback: newFeedback } : idea
        )
      );

      toastService.success("Proposal reviewed successfully!");
      closeStatusModal();
    } catch (error) {
      console.error("[SupervisorIdeaReview] Update status error:", error);
      toastService.error(error.message || "Failed to update proposal status");
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
          <ErrorMessage message={loadError} />
        ) : ideas.length === 0 ? (
          <EmptyState />
        ) : (
          <ProposalTable ideas={ideas} expanded={expanded} onToggleExpanded={toggleExpanded} onOpenStatusModal={openStatusModal} />
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

const ProposalTable = ({ ideas, expanded, onToggleExpanded, onOpenStatusModal }) => (
  <Box className="review-table-box">
    <Table>
      <TableHead>
        <TableRow>
          <TableCell sx={TABLE_STYLES.header}>
            <GroupOutlined sx={{ verticalAlign: "middle", color: "white", mr: 1, fontSize: 28 }} />
            Group
          </TableCell>
          <TableCell sx={TABLE_STYLES.header}>Title</TableCell>
          <TableCell sx={TABLE_STYLES.header}>Status</TableCell>
          <TableCell sx={TABLE_STYLES.header} align="center">
            Action
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {ideas.map((idea) => (
          <ProposalRow key={idea.ideaId} idea={idea} isExpanded={expanded[idea.ideaId]} onToggleExpanded={onToggleExpanded} onOpenStatusModal={onOpenStatusModal} />
        ))}
      </TableBody>
    </Table>
  </Box>
);

const ProposalRow = ({ idea, isExpanded, onToggleExpanded, onOpenStatusModal }) => {
  const status = STATUS_CONFIG[idea.status] || STATUS_CONFIG.pending;

  return (
    <>
      <TableRow hover className="review-table-row" sx={idea.status === "pending" ? { backgroundColor: "#fff9e6" } : {}}>
        <TableCell sx={TABLE_STYLES.cell}>
          <Stack direction="row" gap={1.5} alignItems="center">
            <Typography fontWeight={700} fontSize={20}>
              {maskGroupLabel(idea.groupName)}
            </Typography>
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

        <TableCell sx={TABLE_STYLES.cell} align="center">
          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
            {idea.status === "pending" && (
              <Button
                variant="contained"
                size="small"
                onClick={() => onOpenStatusModal(idea.ideaId)}
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
    <span className="idea-detail-label" style={{ marginBottom: 5 }}>
      Members:
    </span>
    {members.map((member, idx) => (
      <div className="member-row-enhanced" key={idx}>
        <div>
          <span className="member-name-idea">{member.name}</span>
          {member.email && (
            <div className="member-email" style={{ fontSize: 20, color: "#000000" }}>
              {member.email}
            </div>
          )}
        </div>
        <span className="member-sapid" style={{ marginLeft: 8 }}>
          {member.sapId}
        </span>
      </div>
    ))}
  </Box>
);

const FeedbackSection = ({ feedback }) => (
  <div className="idea-feedback-row">
    <label>Feedback:</label>
    {feedback ? (
      <>
        {FEEDBACK_ICONS[feedback.severity]}
        <span style={{ fontSize: 25 }}>{feedback.comment}</span>
      </>
    ) : (
      <span style={{ color: "#aaa" }}>No feedback</span>
    )}
  </div>
);

const StatusUpdateModal = ({ open, status, comment, onClose, onStatusChange, onCommentChange, onSave }) => (
  <Modal open={open} onClose={onClose} aria-labelledby="update-status-modal">
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
      <RadioGroup row value={status} onChange={(e) => onStatusChange(e.target.value)} sx={{ mb: 2 }}>
        <FormControlLabel value="approved" control={<Radio sx={{ "&.Mui-checked": { color: "#219653" } }} />} label="Approve" />
        <FormControlLabel value="rejected" control={<Radio sx={{ "&.Mui-checked": { color: "#e74c3c" } }} />} label="Reject" />
      </RadioGroup>

      <Typography sx={{ mb: 1, fontWeight: 700 }}>Feedback</Typography>
      <TextField placeholder="Write feedback for the students..." fullWidth multiline minRows={3} value={comment} onChange={(e) => onCommentChange(e.target.value)} sx={{ mb: 2 }} />

      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={!comment.trim()}
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
);