import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import EventIcon from "@mui/icons-material/Event";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FlagIcon from "@mui/icons-material/Flag";
import CommentIcon from "@mui/icons-material/Comment";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import { toastService } from "../ToastService/ToastService";
import "./StudentJournal.css";

function formatDateShort(d) {
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString();
}

export default function StudentJournal({ studentEmail }) {
  const [groupedByMonth, setGroupedByMonth] = useState([]);
  const [loading, setLoading] = useState(true);
  const journalRef = useRef();

  useEffect(() => {
    if (!studentEmail) return;
    const fetchJournal = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/journal?email=${studentEmail}`);
        const data = await res.json();
        setGroupedByMonth(data.months || []);
      } catch (err) {
        console.error(err);
        toastService.error("Failed to load journal");
      } finally {
        setLoading(false);
      }
    };
    fetchJournal();
  }, [studentEmail]);

  return (
    <Box>
      <DashboardSectionHeader description="Monthly project diary collecting meetings, completed tasks, and templates.">
        FYP Journey Journal
      </DashboardSectionHeader>

      <div ref={journalRef} className="journal-body">
        {loading && <Typography>Loading...</Typography>}

        {!loading && groupedByMonth.length === 0 && (
          <Paper className="journal-empty">
            <label>No activity found yet</label>
            <label>Start scheduling meetings, completing tasks, or uploading templates — activities will appear here monthly.</label>
          </Paper>
        )}

        {!loading && (
          <div className="journal-grid">
            {groupedByMonth.map((month) => {
              const SLOTS = 5;
              const visible = month.activities.slice(0, SLOTS);
              while (visible.length < SLOTS) visible.push({ placeholder: true });

              return (
                <Paper key={month.monthKey} className="journal-month-card" elevation={1}>
                  <Box className="journal-month-header">
                    <label>{month.monthLabel}</label>
                    <label>{month.activities.length} activities</label>
                  </Box>

                  <Box className="journal-month-content">
                    {visible.map((act, idx) => {
                      if (act.placeholder) {
                        return (
                          <Box key={`ph-${idx}`} className="journal-activity placeholder">
                            <Box className="journal-activity-left">
                              <div className="journal-activity-date">—</div>
                              <div className="journal-activity-icon" />
                            </Box>
                            <Box className="journal-activity-right">
                              <div className="journal-activity-title placeholder-title">No activity</div>
                              <div className="journal-activity-desc" />
                            </Box>
                          </Box>
                        );
                      }

                      return (
                        <Box key={idx} className="journal-activity">
                          <Box className="journal-activity-left">
                            <div className="journal-activity-date">{formatDateShort(act.raw.createDate || act.raw.date || act.raw.createdAt)}</div>
                            <div className="journal-activity-icon">
                              {act.type === "Meeting" && <EventIcon color="primary" />}
                              {act.type === "Task" && <CheckCircleIcon sx={{ color: "#16a34a" }} />}
                              {act.type === "Template" && <FlagIcon sx={{ color: "#f59e0b" }} />}
                            </div>
                          </Box>

                          <Box className="journal-activity-right">
                            <div className="journal-activity-title">{act.title}</div>
                            <div className="journal-activity-desc">{act.description}</div>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              );
            })}
          </div>
        )}
      </div>
    </Box>
  );
}
