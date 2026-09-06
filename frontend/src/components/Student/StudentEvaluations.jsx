import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import { toastService } from "../ToastService/ToastService";
import "./StudentEvaluations.css";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

export default function StudentEvaluations() {
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openProjectId, setOpenProjectId] = useState(null);
  const loggedName = localStorage.getItem("name");

  useEffect(() => {
    const fetchEvals = async () => {
      const email = localStorage.getItem("email");
      if (!email) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/supervisor/student-evaluations/${email}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setEvals(data.evaluations || []);
        } else {
          toastService.error(data.message || "Failed to fetch evaluations");
        }
      } catch (err) {
        console.error(err);
        toastService.error("Server error while fetching evaluations");
      } finally {
        setLoading(false);
      }
    };
    fetchEvals();
  }, []);

  const summaryHeaders = ["FYP Year", "Evaluated By", "Date", "Final Score %"];
  
  const summaryRows = evals.map((rec) => {
    // Each rec is a SupervisorEvaluation document
    // We want to show a summary for each Milestone submission
    const date = rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : "N/A";
    
    // Average marks across all sub-evaluations within this submission
    let totalMarks = 0;
    let maxMarks = 0;
    (rec.evaluations || []).forEach(ev => {
        totalMarks += ev.marks || 0;
        maxMarks += ev.maxMarks || 0;
    });
    
    const scorePercent = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;

    return {
      "FYP Year": rec.fypYear || "N/A",
      "Evaluated By": rec.evaluatedBy?.name || "Supervisor",
      "Date": date,
      "Final Score %": `${scorePercent}%`,
      __raw: rec,
    };
  });

  const renderSummaryActions = (rowObj) => {
    const recId = rowObj.__raw._id;
    return (
      <button
        className="st-clear-btn"
        onClick={() => {
          setOpenProjectId(openProjectId === recId ? null : recId);
        }}
      >
        {openProjectId === recId ? "Close" : "View Rubrics"}
      </button>
    );
  };

  if (loading && evals.length === 0) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <DashboardSectionHeader description="View rubric-based evaluations from your supervisors. See per-milestone breakdowns and detailed feedback.">
        Supervisor Evaluations
      </DashboardSectionHeader>

      <Box sx={{ mb: 2 }}>
        {evals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#666", background: "white", borderRadius: "8px" }}>
                No supervisor evaluations found for your group yet.
            </div>
        ) : (
            <AppTable headers={summaryHeaders} rows={summaryRows} renderActions={renderSummaryActions} />
        )}
      </Box>

      <Box display="grid" gridTemplateColumns="1fr" gap={2}>
        {evals.map((rec) => {
          if (openProjectId !== rec._id) return null;

          return (
            <Box key={rec._id} className="eval-expanded-wrap" sx={{ p: 2, background: '#fff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div className="eval-expanded-title" style={{ marginBottom: 18, fontWeight: 700, color: '#013379' }}>
                Detailed Rubric — {rec.fypYear} ({new Date(rec.createdAt).toLocaleDateString()})
              </div>

              {rec.evaluations
                .filter(subEval => String(subEval.studentName || subEval.name || "").trim() === String(loggedName || "").trim())
                .map((subEval, idx) => (
                <div key={idx} style={{ marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333', marginBottom: 8 }}>
                        {subEval.studentName} {subEval.studentId ? `(SAP: ${subEval.studentId})` : ""}
                    </div>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: 8 }}>Evaluation</th>
                                <th style={{ textAlign: 'center', padding: 8 }}>Marks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                                <td style={{ padding: 8 }}>Overall Score</td>
                                <td style={{ textAlign: 'center', padding: 8 }}><strong>{subEval.marks ?? "—"}</strong> / {subEval.maxMarks ?? "—"}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    {subEval.feedback && (
                        <div style={{ background: '#f0f7ff', padding: '10px 15px', borderRadius: 8, fontSize: '0.9rem', color: '#1e40af' }}>
                            <strong>Feedback:</strong> {subEval.feedback}
                        </div>
                    )}
                </div>
              ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}