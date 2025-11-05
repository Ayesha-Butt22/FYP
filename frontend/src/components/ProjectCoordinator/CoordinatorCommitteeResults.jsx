import React, { useEffect, useState } from "react";
import axios from "axios";
import ToastService, { toastService } from "../ToastService/ToastService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./CommitteeResults.css";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  AccessTime,
  Place,
} from "@mui/icons-material";

export default function CoordinatorCommitteeResults() {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/committee-evaluation");
        if (res.data.success && Array.isArray(res.data.data)) {
          const formatted = res.data.data.map((item) => {
            const group = item.groupId || {};
            const schedule = item.scheduleId || {};
            const slot = (schedule.slots || []).find((s) => s._id === item.slotId) || {};
            const isApprovedByCoordinator = item.isApprovedByCoordinator;
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
              isApproved: isApprovedByCoordinator,
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

  const handlePublish = async (row) => {
    const isApproved = row.isApproved ;
    if (isApproved) {
      ToastService.info('Evaluation already published');
      return;
    }
    const response = await fetch(`http://localhost:5000/api/committee-evaluation/approve`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        id: row.id,
      }),
    });
    const data = await response.json();
    if(data.success){
    ToastService.success('Evaluation published successfully');
    }else {
      ToastService.error('Evaluation publish failed');
    }
  }

  return (
      <div className="cor-committee-container">
        <DashboardSectionHeader description="Coordinator view of all committee evaluations. Expand a group to view detailed remarks and marks.">
          Committee Evaluation Results
        </DashboardSectionHeader>

        <div className="cor-committee-paper">
          <table className="cor-committee-table">
            <thead className="cor-committee-thead">
            <tr>
              <th></th>
              <th><strong>Group#</strong></th>
              <th><strong>Student Names</strong></th>
              <th><strong>Venue</strong></th>
              <th><strong>Action</strong></th>
            </tr>
            </thead>

            <tbody>
            {rows.map((row) => {
              const allStudents = [
                row.evaluations?.[0]?.students.map((s) => s.name).join(", "),
              ];

              return (
                  <React.Fragment key={row.id}>
                    <tr
                        className="cor-committee-row"
                        onClick={() => toggleExpand(row.id)}
                        style={{ cursor: "pointer" }}
                    >
                      <td>
                        {expanded[row.id] ? (
                            <KeyboardArrowUp fontSize="small" />
                        ) : (
                            <KeyboardArrowDown fontSize="small" />
                        )}
                      </td>
                      <td style={{ textTransform: 'capitalize'}}>{row.groupId}</td>
                      <td>{allStudents}</td>
                      <td className="cor-venue-cell">
                        <Place fontSize="small" color="primary" />
                        <span>{row.venue}</span>
                      </td>
                      <td className="cor-time-cell">
                        <AccessTime fontSize="small" color="secondary" />
                        <span>{row.slotTime}</span>
                      </td>
                      <td>
                        <button
                            type="submit"
                            className="btn main-btn"
                            onClick={() => {
                              handlePublish(row)}}
                        >
                         Publish
                        </button>
                      </td>
                    </tr>

                    {expanded[row.id] && (
                        <tr>
                          <td colSpan="6" className="cor-committee-expand">
                            <div className="cor-committee-expand-content">
                              {row.evaluations.map((evalItem, i) => (
                                  <div key={i} className="cor-committee-panel-card">
                                    <div className="cor-committee-panel-header">
                                      Panel Member: {evalItem.evaluatedBy}{" "}
                                      <span className="cor-panel-role">
                                  ({evalItem.role})
                                </span>
                                    </div>

                                    <div className="cor-committee-student-grid">
                                      {evalItem.students.map((stu, j) => (
                                          <div
                                              key={j}
                                              className="cor-committee-student-box"
                                          >
                                            <div>
                                              <strong>{stu.name}</strong> ({stu.sapId})
                                            </div>
                                            <div>Presentation: {stu.presentation}/10</div>
                                            <div>Performance: {stu.performance}/10</div>
                                          </div>
                                      ))}
                                    </div>

                                    <div className="cor-committee-comments">
                                      <strong>Comments:</strong> {evalItem.comments}
                                    </div>

                                    <div className="cor-committee-submitted">
                                      Submitted at: {evalItem.submittedAt}
                                    </div>
                                  </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                    )}
                  </React.Fragment>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
  );
}
