import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircleOutline,
  HourglassEmptyOutlined,
  CancelOutlined,
  AccessTime,
} from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService.jsx";
import {
  updateProposalStatus,
  fetchSupervisorProposals, // ✅ updated import
} from "../Api/Proposals/supervisorReviewApi.jsx";
import "./SupervisorIdeaReview.css";

/* ---------------- TIMER UTILS ---------------- */
const getHoursPassed = (createdAt) => {
  if (!createdAt) return 0;
  const now = new Date();
  const created = new Date(createdAt);
  return (now - created) / (1000 * 60 * 60); // convert ms to hours
};

const getTimerChip = (createdAt) => {
  const hours = getHoursPassed(createdAt);

  if (hours < 10) {
    return { label: "Waiting", color: "#888", bg: "#f1f1f1" };
  }
  if (hours <= 16) {
    return { label: `${Math.floor(16 - hours)}h left`, color: "#b97b16", bg: "#fff7de" };
  }
  return { label: "Expired", color: "#e74c3c", bg: "#ffeaea" };
};
/* --------------------------------------------- */

const STATUS_CONFIG = {
  approved: { label: "Accepted", icon: <CheckCircleOutline sx={{ color: "#219653" }} /> },
  pending: { label: "Under Review", icon: <HourglassEmptyOutlined sx={{ color: "#f2994a" }} /> },
  rejected: { label: "Rejected", icon: <CancelOutlined sx={{ color: "#e74c3c" }} /> },
};

const getStatusKey = (status) => {
  if (status === 1) return "approved";
  if (status === 2) return "rejected";
  return "pending";
};

const mapProposalToIdea = (p) => ({
  ideaId: p._id,
  createdAt: p.createdAt,
  groupName: p.groupId?.groupId || "Group",
  title: p.projectTitle || "Untitled",
  methodology: p.projectDescription || "",
  tools: p.projectTools || "",
  domain: p.projectSpecialization || "",
  status: getStatusKey(p.projectStatus),
  members: [p.groupId?.leader, p.groupId?.member2, p.groupId?.member3].filter(Boolean),
  feedback: p.projectSupervisorComments || "",
});

export default function SupervisorIdeaReview() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSupervisorProposals(); // ✅ use correct API function
        setIdeas(data.map(mapProposalToIdea));
      } catch (e) {
        toastService.error("Failed to load proposals");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (id, status, comment) => {
    try {
      await updateProposalStatus(id, status, comment);
      toastService.success("Proposal updated");
      setIdeas((p) => p.filter((i) => i.ideaId !== id));
    } catch (err) {
      toastService.error("Failed to update proposal");
    }
  };

  if (loading)
    return (
      <Box textAlign="center" mt={6}>
        <CircularProgress />
      </Box>
    );

  return (
    <>
      <DashboardSectionHeader description="Pending proposals with automatic review timer">
        FYP Idea Review
      </DashboardSectionHeader>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Group</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Timer</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {ideas.map((idea) => {
            const timer = getTimerChip(idea.createdAt);
            return (
              <TableRow key={idea.ideaId}>
                <TableCell>{idea.groupName}</TableCell>
                <TableCell>{idea.title}</TableCell>
                <TableCell>
                  <Chip
                    icon={STATUS_CONFIG[idea.status].icon}
                    label={STATUS_CONFIG[idea.status].label}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<AccessTime />}
                    label={timer.label}
                    sx={{ bgcolor: timer.bg, color: timer.color, fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    disabled={timer.label === "Expired"}
                    onClick={() => handleSave(idea.ideaId, 1, "Approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    color="error"
                    disabled={timer.label === "Expired"}
                    onClick={() => handleSave(idea.ideaId, 2, "Rejected")}
                  >
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
