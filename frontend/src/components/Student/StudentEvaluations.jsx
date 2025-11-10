import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
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
    members: ["Ali Raza", "Sana Tariq", "Bilal Khan"],
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
  const [openProjectId, setOpenProjectId] = useState(null);

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
      <button
        className="st-clear-btn"
        onClick={() => {
          setOpenProjectId(openProjectId === pid ? null : pid);
        }}
      >
        Open
      </button>
    );
  };

  return (
    <Box>
      <DashboardSectionHeader description="View rubric-based evaluations from your supervisors. See per-milestone breakdowns and weighted final score.">
        Evaluations
      </DashboardSectionHeader>

      <Box sx={{ mb: 2 }}>
        <AppTable headers={summaryHeaders} rows={summaryRows} renderActions={renderSummaryActions} />
      </Box>

      <Box display="grid" gridTemplateColumns="1fr" gap={12}>
        {evals.map((rec) => {
          if (openProjectId !== rec.projectId) return null;

          // Compute group-level totals
          const totals = rec.milestones.reduce(
            (acc, m) => {
              const rTotal = computeRubricTotal(m.rubric);
              acc.scored += rTotal.scored;
              acc.max += rTotal.max;
              return acc;
            },
            { scored: 0, max: 0 }
          );

          const scorePercent = totals.max > 0 ? Math.round((totals.scored / totals.max) * 100) : 0;

       
          const memberRows = (Array.isArray(rec.members) && rec.members.length > 0)
            ? rec.members.map((member) => ({
                "FYP Year": "FYP1",
                "Group Member": member,
                Score: totals.scored,
                Max: totals.max,
                "Percentage": totals.max ? `${scorePercent}%` : "—",
                __raw: rec,
              }))
            : [
                {
                  "FYP Year": "FYP1",
                  "Group Member": "—",
                  Score: totals.scored,
                  Max: totals.max,
                  "Percentage": totals.max ? `${scorePercent}%` : "—",
                  __raw: rec,
                },
              ];

          return (
            <Box key={rec.projectId} className="eval-expanded-wrap">
              <div className="eval-expanded-title" style={{ marginBottom: 18 }}>
                {rec.projectTitle} — Members Summary
              </div>

              <div style={{ marginTop: 6 }}>
                <AppTable
                  headers={["FYP Year", "Group Member", "Score", "Max", "Percentage"]}
                  rows={memberRows}
                />
              </div>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}