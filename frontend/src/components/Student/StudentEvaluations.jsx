import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress,
  Button,
  Chip,
  Divider,
  Collapse,
} from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import { toastService } from "../ToastService/ToastService";
import "./StudentEvaluations.css";

const DEMO_EVALS = [
  {
    projectId: "G-1001",
    projectTitle: "Smart Attendance System",
    supervisor: "Dr Ayesha",
    evaluatedOn: "2025-10-15",
    milestones: [
      {
        id: "proposal",
        name: "Proposal",
        weight: 0.2,
        rubric: [
          { id: "r1", criterion: "Problem definition", max: 10, score: 8, feedback: "Clear but needs minor scope reduction" },
          { id: "r2", criterion: "Objectives", max: 10, score: 9, feedback: "Good objectives" },
          { id: "r3", criterion: "Literature review", max: 10, score: 7, feedback: "Add 2 more refs" },
        ],
      },
      {
        id: "mid",
        name: "Mid",
        weight: 0.3,
        rubric: [
          { id: "r1", criterion: "Design completeness", max: 15, score: 11, feedback: "Design OK" },
          { id: "r2", criterion: "Implementation progress", max: 15, score: 12, feedback: "Working prototype" },
        ],
      },
      {
        id: "final",
        name: "Final Report / Defense",
        weight: 0.5,
        rubric: [
          { id: "r1", criterion: "Report quality", max: 20, score: 0, feedback: "" },
          { id: "r2", criterion: "Defense", max: 30, score: 0, feedback: "" },
        ],
      },
    ],
  },
  {
    projectId: "G-1002",
    projectTitle: "AI-Based Disease Prediction",
    supervisor: "Dr Bilal",
    evaluatedOn: "2025-10-12",
    milestones: [
      {
        id: "proposal",
        name: "Proposal",
        weight: 0.2,
        rubric: [
          { id: "r1", criterion: "Problem definition", max: 10, score: 9, feedback: "Excellent" },
          { id: "r2", criterion: "Objectives", max: 10, score: 8, feedback: "Good" },
        ],
      },
      {
        id: "mid",
        name: "Mid",
        weight: 0.3,
        rubric: [
          { id: "r1", criterion: "Model baseline", max: 20, score: 18, feedback: "Strong baseline" },
        ],
      },
      {
        id: "final",
        name: "Final Report / Defense",
        weight: 0.5,
        rubric: [
          { id: "r1", criterion: "Final accuracy", max: 50, score: 45, feedback: "Great results" },
        ],
      },
    ],
  },
];

const STORAGE_KEY = "student_evaluations_v1";

function readEvals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEMO_EVALS;
  } catch {
    return DEMO_EVALS;
  }
}

function writeEvals(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function callToast(message, type = "success") {
  try {
    if (toastService) {
      if (type === "success" && typeof toastService.success === "function") {
        toastService.success(message);
        return;
      }
      if (type === "error" && typeof toastService.error === "function") {
        toastService.error(message);
        return;
      }
      if (typeof toastService.show === "function") {
        toastService.show(message, { type });
        return;
      }
      if (typeof toastService === "function") {
        toastService(message);
        return;
      }
    }
  } catch (e) {
    console.warn("toastService call failed", e);
  }
  alert(message);
}

function computeRubricTotal(rubric) {
  const max = rubric.reduce((s, r) => s + (r.max || 0), 0);
  const scored = rubric.reduce((s, r) => s + (r.score || 0), 0);
  const percent = max > 0 ? Math.round((scored / max) * 100) : 0;
  return { max, scored, percent };
}

function computeFinalWeighted(milestones) {
  let total = 0;
  let hasAny = false;
  milestones.forEach((m) => {
    const { percent } = computeRubricTotal(m.rubric);
    if (m.weight && typeof percent === "number") {
      total += percent * m.weight;
      hasAny = true;
    }
  });
  return hasAny ? Math.round(total) : null;
}

export default function StudentEvaluations() {
  const [evals, setEvals] = useState(() => readEvals());
  const [openRow, setOpenRow] = useState(null);

  useEffect(() => {
    writeEvals(evals);
  }, [evals]);

  const summaryHeaders = ["Project ID", "Project Title", "Supervisor", "Weighted Final %"];
  const summaryRows = evals.map((rec) => {
    const finalPercent = computeFinalWeighted(rec.milestones);
    return {
      "Project ID": rec.projectId,
      "Project Title": rec.projectTitle,
      Supervisor: rec.supervisor,
      "Weighted Final %": finalPercent !== null ? `${finalPercent}%` : "In Progress",
      __raw: rec,
    };
  });

  const renderSummaryActions = (rowObj) => {
    const pid = rowObj["Project ID"];
    return (
      <Button
        size="small"
        variant="outlined"
        onClick={() => {
          setOpenRow(openRow === pid ? null : pid);
          callToast(`Opened evaluation for ${pid}`, "success");
        }}
      >
        Open
      </Button>
    );
  };

  return (
    <Box>
      <DashboardSectionHeader description="View rubric-based evaluations from your supervisors. See per-milestone breakdowns, feedback and weighted final score.">
        Evaluations
      </DashboardSectionHeader>

      <Box sx={{ mb: 2 }}>
        <AppTable headers={summaryHeaders} rows={summaryRows} renderActions={renderSummaryActions} />
      </Box>

      <Box display="grid" gridTemplateColumns="1fr" gap={20}>
        {evals.map((rec) => {
          const finalPercent = computeFinalWeighted(rec.milestones);
          const gradedMilestones = rec.milestones.map((m) => ({
            ...m,
            summary: computeRubricTotal(m.rubric),
          }));

          return (
            <Paper key={rec.projectId} className="eval-card" elevation={2}>
              <Box className="eval-card-header">
                <Box>
                  <Typography variant="h5" className="eval-project-title">
                    {rec.projectTitle}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Supervisor: {rec.supervisor} • Evaluated: {rec.evaluatedOn}
                  </Typography>
                </Box>

                <Box textAlign="right">
                  {finalPercent !== null ? (
                    <>
                      <Typography variant="h6" className="eval-final-percent">
                        {finalPercent}%
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Weighted Final
                      </Typography>
                    </>
                  ) : (
                    <Chip label="In Progress" color="warning" />
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box className="eval-milestones-row">
                {gradedMilestones.map((m) => (
                  <Box key={m.id} className="milestone-summary">
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {m.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {m.summary.scored}/{m.summary.max} points
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={m.summary.percent}
                        sx={{ width: 160, height: 10, borderRadius: 2 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {m.summary.percent}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Button
                  startIcon={<CommentIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => setOpenRow(openRow === rec.projectId ? null : rec.projectId)}
                >
                  View Rubric & Feedback
                </Button>

                <Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      const msg =
                        finalPercent !== null
                          ? `Final grade: ${finalPercent}%`
                          : "Detailed evaluation not complete yet";
                      callToast(msg, "success");
                    }}
                    className="eval-download-btn"
                  >
                    View Detailed
                  </Button>
                </Box>
              </Box>

              <Collapse in={openRow === rec.projectId} timeout="auto" unmountOnExit>
                <Box className="eval-rubric-wrap">
                  {rec.milestones.map((m) => (
                    <Box key={m.id} className="eval-rubric-card">
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {m.name} — Weight: {Math.round(m.weight * 100)}%
                        </Typography>
                        <Typography variant="subtitle2" color="textSecondary">
                          {computeRubricTotal(m.rubric).scored}/{computeRubricTotal(m.rubric).max} pts
                        </Typography>
                      </Box>

                      <Table size="small" className="rubric-table">
                        <TableHead>
                          <TableRow>
                            <TableCell>Criterion</TableCell>
                            <TableCell>Score</TableCell>
                            <TableCell>Max</TableCell>
                            <TableCell>Feedback</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {m.rubric.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{r.criterion}</TableCell>
                              <TableCell>{r.score}</TableCell>
                              <TableCell>{r.max}</TableCell>
                              <TableCell>
                                {r.feedback || <em style={{ color: "#94a3b8" }}>No comment</em>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
