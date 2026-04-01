import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Box, CircularProgress, Typography, Stack, Divider, Paper } from "@mui/material";
import { toastService } from "../ToastService/ToastService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { CheckCircleOutline, StarOutline, FeedbackOutlined, EmojiEvents } from "@mui/icons-material";
import "./StudentEvaluations.css";

const fypLabel = (y) => (y || "").toString().toUpperCase().replace("FYP", "FYP-");

export default function StudentCommitteeResults() {
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openEvalId, setOpenEvalId] = useState(null);
  const email = localStorage.getItem('email');
  const loggedStudentId = localStorage.getItem('studentId');
  const name = localStorage.getItem('name');

  useEffect(() => {
    if (!email) return;
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/committee-evaluation/student/${email}`);
        if (res.data.success) {
          setEvals(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
        toastService.error("Failed to fetch evaluations.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, [email]);

  const toggleExpand = (id) => {
    setOpenEvalId(openEvalId === id ? null : id);
  };

  // Process raw evaluations into a more render-friendly format
  const processedData = useMemo(() => {
    return evals.map(doc => {
      const schedule = doc.scheduleId || {};
      const milestone = fypLabel(`${schedule.fypPart || "FYP"} ${schedule.week || ""}`);
      const isWeek4 = /week\s*4/i.test(milestone);
      const isWeek16 = /week\s*16/i.test(milestone);

      // Aggregate panel scores for THIS student
      const panelEvals = (doc.evaluations || []).map(ev => {
        const studentInfo = (ev.students || []).find(s => {
          const sId = String(s.studentId || s.sapId || "").trim();
          const sName = String(s.name || "").trim().toLowerCase();
          return (loggedStudentId && sId === String(loggedStudentId).trim()) ||
            (name && sName === String(name).trim().toLowerCase());
        });

        return {
          evaluator: ev.evaluatedBy?.name || "Panel Member",
          role: ev.evaluatedBy?.role || "Member",
          comments: ev.comments || "No comments",
          cloMarks: ev.totalCloMarks || 0,
          studentInfo
        };
      });

      // Calculate final committee score (Avg CLO * 0.5 for 50% weight)
      const totalAssigned = doc.assignedPanelSize || 3;
      const sumClo = panelEvals.reduce((sum, e) => sum + e.cloMarks, 0);
      const avgClo = sumClo / totalAssigned;
      const committeeScore = +(avgClo * 0.5).toFixed(2);

      return {
        id: doc._id,
        milestone,
        isWeek4,
        isWeek16,
        committeeScore,
        date: doc.approvedAt ? new Date(doc.approvedAt).toLocaleDateString() : "—",
        panelEvals,
        venue: schedule.venue || "TBA"
      };
    });
  }, [evals, loggedStudentId, name]);

  if (loading && evals.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
        <CircularProgress size={60} thickness={4} color="primary" />
      </Box>
    );
  }

  return (
    <div className="student-evals-container">
      <DashboardSectionHeader description="View results and feedback from the FYP committee panels. Average results across panel members determine your final committee score.">
        Committee Results
      </DashboardSectionHeader>

      <Box sx={{ mt: 3 }}>
        {processedData.length === 0 ? (
          <div className="eval-empty-state">
            <Typography variant="h6" fontWeight={700} color="#94a3b8">
              No committee results published yet.
            </Typography>
            <Typography variant="body2" color="#64748b" sx={{ mt: 1 }}>
              Official results appear here once reviewed and published by the Project Coordinator.
            </Typography>
          </div>
        ) : (
          processedData.map((item) => (
            <div className="eval-summary-card" key={item.id}>
              {/* Card Header */}
              <div className="eval-card-header">
                <div>
                  <div className="eval-milestone-title">{item.milestone} Assessment</div>
                  <Typography variant="caption" color="text.secondary">
                    Published on {item.date} • Venue: {item.venue}
                  </Typography>
                </div>

                <Stack direction="row" spacing={2} alignItems="center">
                  {!item.isWeek4 && (
                    <div className="eval-score-chip" style={{ background: '#f0f9ff', color: '#0369a1' }}>
                      <EmojiEvents sx={{ fontSize: 16, mr: 0.5 }} />
                      Score: {item.committeeScore}/50
                    </div>
                  )}
                  {item.isWeek4 && (
                    <div className="eval-score-chip" style={{ background: '#f8fafc', color: '#64748b' }}>
                      Feedback Only
                    </div>
                  )}
                  <button
                    className="st-clear-btn"
                    onClick={() => toggleExpand(item.id)}
                  >
                    {openEvalId === item.id ? "Hide Details" : "View Panel Remarks"}
                  </button>
                </Stack>
              </div>

              {/* Expanded Panel Details */}
              {openEvalId === item.id && (
                <div className="eval-card-content">
                  <Typography variant="subtitle2" fontWeight={800} color="#01337a" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Panel Member Breakdowns ({item.panelEvals.length})
                  </Typography>

                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
                    {item.panelEvals.map((p, idx) => (
                      <Paper
                        key={idx}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <Typography variant="body1" fontWeight={700} color="#1e293b">{p.evaluator}</Typography>
                            <span className="panel-member-badge">{p.role}</span>
                          </div>
                          {!item.isWeek4 && (
                            <Typography variant="h6" fontWeight={800} color="#0369a1">
                              {p.cloMarks}<span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#94a3b8', marginLeft: 4 }}>/ 100</span>
                            </Typography>
                          )}
                        </div>

                        <Divider sx={{ opacity: 0.5 }} />

                        <div className="eval-feedback-box" style={{ margin: 0, padding: '12px', background: 'white' }}>
                          <strong>Remarks:</strong>
                          <div className="eval-feedback-text" style={{ fontSize: '0.85rem' }}>
                            {p.comments}
                          </div>
                        </div>
                      </Paper>
                    ))}
                  </Box>

                  {!item.isWeek4 && (
                    <div className="eval-reason-box" style={{ marginTop: '1.5rem', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <StarOutline sx={{ fontSize: 18, color: '#0369a1' }} />
                        <Typography variant="body2" fontWeight={700} color="#0369a1">Calculation Logic</Typography>
                      </Stack>
                      <Typography variant="caption" color="#0c4a6e" display="block" sx={{ mt: 0.5 }}>
                        Final score is calculated as: <strong>(Avg. Panel Marks / 100) × 50 = Committee Grade Contribution</strong>.
                        Missed submissions from panel members are treated as 0 in the average calculation.
                      </Typography>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </Box>
    </div>
  );
}
