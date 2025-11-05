import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Typography,
  Grid,
  Stack,
  Divider,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccessTime,
  Place,
} from "@mui/icons-material";
import axios from "axios";
import { toastService } from "../ToastService/ToastService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./CommitteeResults.css";

export default function CoordinatorCommitteeResults() {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState({});

  // ✅ Fetch and transform API data
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/committee-evaluation");
        if (res.data.success && Array.isArray(res.data.data)) {
          const formatted = res.data.data.map((item) => {
            const group = item.groupId || {};
            const schedule = item.scheduleId || {};
            const slot = (schedule.slots || []).find(
              (s) => s._id === item.slotId
            ) || {};

            const evaluations = (item.evaluations || []).map((ev) => ({
              evaluatedBy: ev.evaluatedBy?.name || "N/A",
              email: ev.evaluatedBy?.email,
              role: ev.evaluatedBy?.role,
              comments: ev.comments || "—",
              submittedAt: new Date(ev.submittedAt).toLocaleString(),
              students: (ev.students || []).map((s) => ({
                name: s.name,
                sapId: s.studentId,
                presentation: s.presentationMarks,
                performance: s.performanceMarks,
              })),
            }));

            return {
              id: item._id,
              groupId: group.groupId || "Unknown",
              venue: schedule.venue || "Not Assigned",
              slotTime: `${new Date(slot.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} - ${new Date(slot.endTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`,
              evaluations,
              createdAt: new Date(item.createdAt).toLocaleString(),
            };
          });
          setRows(formatted);
        } else {
          toastService.error("No evaluation data found.");
        }
      } catch (err) {
        console.error(err);
        toastService.error("Failed to fetch evaluations.");
      }
    };
    fetchEvaluations();
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Box className="cor-committee-container">
      <DashboardSectionHeader description="Coordinator view of all committee evaluations. Expand a group to view detailed remarks and marks.">
        Committee Evaluation Results
      </DashboardSectionHeader>

      <Paper className="cor-committee-paper">
        <TableContainer>
          <Table>
            <TableHead className="cor-committee-thead">
              <TableRow>
                <TableCell />
                <TableCell><labe>Group#</labe></TableCell>
                <TableCell><strong>Student Names</strong></TableCell>
                <TableCell><strong>Venue</strong></TableCell>
                <TableCell><strong>Slot Timing</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row) => {
                const allStudents = [
                  row.evaluations?.[0]?.students.map((s) => s.name).join(", "),
                ];

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      hover
                      className="cor-committee-row"
                      onClick={() => toggleExpand(row.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <IconButton size="small">
                          {expanded[row.id] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{row.groupId}</TableCell>
                      <TableCell>{allStudents}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          
                          <Typography variant="body2">{row.venue}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                        
                          <Typography variant="body2">{row.slotTime}</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={6}
                      >
                        <Collapse in={expanded[row.id]} timeout="auto" unmountOnExit>
                          <Box className="cor-committee-expand">
                            {row.evaluations.map((evalItem, i) => (
                              <Paper
                                key={i}
                                className="cor-committee-panel-card"
                                elevation={2}
                              >
                                <Typography
                                  variant="subtitle1"
                                  className="cor-committee-panel-header"
                                >
                                  Panel Member: {evalItem.evaluatedBy}{" "}
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    ({evalItem.role})
                                  </Typography>
                                </Typography>
                                <Divider sx={{ mb: 1 }} />

                                <Grid container spacing={1}>
                                  {evalItem.students.map((stu, j) => (
                                    <Grid
                                      item
                                      xs={12}
                                      sm={6}
                                      key={j}
                                      className="cor-committee-student-box"
                                    >
                                      <Typography variant="body2">
                                        <strong>{stu.name}</strong> ({stu.sapId})
                                      </Typography>
                                      <Typography variant="body2">
                                        Presentation: {stu.presentation}/10
                                      </Typography>
                                      <Typography variant="body2">
                                        Performance: {stu.performance}/10
                                      </Typography>
                                    </Grid>
                                  ))}
                                </Grid>

                                <Divider sx={{ my: 1 }} />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 0.5 }}
                                >
                                  <strong>Comments:</strong> {evalItem.comments}
                                </Typography>

                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                  sx={{ display: "block", mt: 0.5 }}
                                >
                                  Submitted at: {evalItem.submittedAt}
                                </Typography>
                              </Paper>
                            ))}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
