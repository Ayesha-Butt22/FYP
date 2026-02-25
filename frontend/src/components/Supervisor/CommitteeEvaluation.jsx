//CommitteEvaluation
import React, { useEffect, useState } from "react";
import "./CommitteeEvaluation.css";
import EvaluationService from "../Api/EvaluationService.jsx";
import ToastService from "../ToastService/ToastService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import CsCloPart1 from "./CS part-1/CsCloPart1.jsx";
import CsCloPart2 from "./CS part-2/CsCloPart2.jsx";
import SeCloPart1 from "./SE part-1/SeCloPart1.jsx";
import SeCloPart2 from "./SE part-2/SeCloPart2.jsx";


export default function CommitteeEvaluation() {
  const [facultyData, setFacultyData] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);
  const [week , setWeek] = useState(4);
  const [schedule , setSchedule] = useState(null);
  const [finalEvaluationInfo, setFinalEvaluationInfo] = useState(null);

  const maskGroupId = (groupId) => {
    if (!groupId) return "";
    const lastFive = groupId.slice(-5);
    return `Group-${lastFive}`;
  };
  const resolveFinalEvaluation = async (groupId) => {
  try {
    const res = await fetch(
      "http://localhost:5000/api/committee-evaluation/resolve-final-evaluation",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      }
    );

    const data = await res.json();

    if (data.success) {
      setFinalEvaluationInfo(data);
    } else {
      ToastService.error("Unable to resolve final evaluation type");
    }
  } catch (err) {
    console.error(err);
  }
};

  useEffect(() => {
    const fetchFacultyPanel = async () => {
      try {
        setLoading(true);
        const email = localStorage.getItem("email");
        const response = await fetch("http://localhost:5000/api/evaluation/checkFaculty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const result = await response.json();

        if (result?.success && result?.data) {
          setFacultyData(result.data);
        } else {
          setFacultyData(null);
        }
      } catch (err) {
        console.error("Error fetching faculty data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyPanel();
  }, []);

  const handleCheckGroup = async (slot , panel) => {
  try {
    setLoading(true);
    setFinalEvaluationInfo(null);   // 🔥 Important reset

    setActiveSlot({ ...slot, panel });
    setWeek(panel.week === 'Week 4' ? 4 : 13);
    setSchedule(panel._id);

    const bookedRes = await EvaluationService.getSingleGroups({
      scheduleId: panel._id,
      slotId: slot._id,
    });

    if (bookedRes?.success && bookedRes.data?.length > 0) {
      const group = bookedRes.data[0];
      setSelectedGroup(group);

      // 🔥 Only resolve when week 13
      if (panel.week !== "Week 4") {
        await resolveFinalEvaluation(group.groupId);
      }

      const initialForm = {};
      group.members?.forEach((m) => {
        initialForm[m.studentId] = { presentation: "", performance: "" };
      });
      initialForm.comments = "";
      setFormData(initialForm);
    } else {
      ToastService.error("No group booked for this slot.");
    }
  } catch (err) {
    console.error(err);
    ToastService.error("Error fetching group data.");
  } finally {
    setLoading(false);
  }
};

  const handleInputChange = (studentId, field, value) => {
    
    // Allow only numbers and empty string

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], [field]: value },
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!selectedGroup || !facultyData || !activeSlot) {
        ToastService.error("Incomplete data — please select a slot and group first.");
        return;
      }

      const evaluatedBy = localStorage.getItem("id") || localStorage.getItem("userId");
      if (!evaluatedBy) {
        ToastService.error("Faculty ID not found in localStorage.");
        return;
      }

      const students = selectedGroup.members.map((m) => ({
        studentId: m.studentId,
        name: m.name,
        presentationMarks: parseFloat(formData[m.studentId]?.presentation) || 0,
        performanceMarks: parseFloat(formData[m.studentId]?.performance) || 0,
      }));

      const payload = {
        scheduleId: schedule,
        slotId: activeSlot._id,
        groupId: selectedGroup.groupMongoId,
        evaluatedBy,
        comments: formData.comments || "",
        students,
      };

      setLoading(true);

      const response = await fetch("http://localhost:5000/api/committee-evaluation/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        ToastService.success("Evaluation submitted successfully!");
        setSelectedGroup(null);
        setActiveSlot(null);
      } else {
        ToastService.error(result.message || "Failed to submit evaluation.");
      }
    } catch (err) {
      console.error("Submit Evaluation Error:", err);
      ToastService.error("Server error while submitting evaluation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedGroup(null);
    setActiveSlot(null);
  };


  if (loading) return <div className="eval-sup-loading">Loading...</div>;
  if (!facultyData)
    return (
        <>
          <DashboardSectionHeader description="View committee evaluation results for groups you supervise (read-only)">
            Committee Results — Supervisor View
          </DashboardSectionHeader>
          <label>
            No Committee Results to display right now
          </label>
        </>
    );


  return (
      <>
        <DashboardSectionHeader
            description={`Committee members evaluate groups (FYP-1 / FYP-2). Evaluate individual students first, then submit group-level evaluation`}
        >
          Committee Evaluation
        </DashboardSectionHeader>

        <div className="eval-sup-container">
          {facultyData.map((panel, i) => (
              <div key={i} className="eval-sup-panel">
                <div className="eval-sup-header">
                  <p>
                    <strong>Week:</strong> {panel.week} &nbsp; | &nbsp;
                    <strong>FYP Part:</strong> {panel.fypPart?.toUpperCase()} &nbsp; | &nbsp;
                    <strong>Venue:</strong> {panel.venue}
                  </p>
                </div>

                <div className="eval-sup-slots-grid">
                  {panel.slots?.map((slot, idx) => {
                    const slotDate = new Date(slot.startTime);
                    const dateStr = slotDate.toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                    const startTime = slotDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const endTime = new Date(slot.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const bookedBy = slot.bookedBy
                        ? maskGroupId(slot.bookedBy)
                        : false;

                    return (
                        <div key={idx} className="eval-sup-slot-card eval-sup-free">
                          <div className="eval-sup-slot-time">
                            <span className="eval-sup-slot-date">{dateStr}</span>
                            <br />
                            {startTime} - {endTime}
                          </div>
                          <div>{bookedBy}</div>

                          {bookedBy ? (
                              <button
                                  className="eval-sup-open-btn"
                                  onClick={() => handleCheckGroup(slot, panel)}
                              >
                                Evaluate
                              </button>
                          ) : (
                              <div className="eval-sup-unbooked">Not Booked</div>
                          )}
                        </div>
                    );
                  })}
                </div>
              </div>
          ))}


          {selectedGroup && (
              <div className="eval-sup-form-container">
                <div className="eval-sup-form-header">
                  <h3>Evaluate Group: {maskGroupId(selectedGroup.groupId)}</h3>
                  <button
                      className="eval-sup-close-btn"
                      onClick={handleCancel}
                  >
                    ✕
                  </button>
                </div>
                <div className="eval-sup-form-info">
                    <p><b> Project Title :</b> {selectedGroup.project.projectTitle} </p>
                    <p><b> Project Description : </b>{selectedGroup.project.projectDescription} </p>
                    <p><b> Project Tools :</b> {selectedGroup.project.projectTools} </p>
                    <p><b> Project Supervisor : </b>{selectedGroup.project.projectSupervisor} </p>
                </div>

                <div className="eval-sup-form-info">
                  <p>
                    <strong>Slot:</strong>{" "}
                    {new Date(activeSlot.startTime).toLocaleDateString()}{" "}
                    {new Date(activeSlot.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(activeSlot.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {selectedGroup.proposalTitle && (
                      <p>
                        <strong>Proposal:</strong> {selectedGroup.proposalTitle}
                      </p>
                  )}
                </div>



               {/* ================= WEEK 4 FORM ================= */}
{week === 4 && selectedGroup && (
  <table className="eval-sup-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Presentation Marks</th>
        <th>Performance Marks</th>
      </tr>
    </thead>

    <tbody>
      {selectedGroup.members?.map((m) => (
        <tr key={m.studentId}>
          <td>{m.name}</td>

          <td>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0-10"
              value={formData[m.studentId]?.presentation || ""}
              onChange={(e) =>
                handleInputChange(
                  m.studentId,
                  "presentation",
                  e.target.value
                )
              }
            />
          </td>

          <td>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0-10"
              value={formData[m.studentId]?.performance || ""}
              onChange={(e) =>
                handleInputChange(
                  m.studentId,
                  "performance",
                  e.target.value
                )
              }
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}

{/* ================= FINAL EVALUATION ================= */}
{week === 13 && selectedGroup && finalEvaluationInfo && (
  <>
    {finalEvaluationInfo.department === "CS" &&
      finalEvaluationInfo.fypPart === "fyp-1" && (
        <CsCloPart1 group={selectedGroup} />
      )}

    {finalEvaluationInfo.department === "CS" &&
      finalEvaluationInfo.fypPart === "fyp-2" && (
        <CsCloPart2 group={selectedGroup} />
      )}

    {finalEvaluationInfo.department === "SE" &&
      finalEvaluationInfo.fypPart === "fyp-1" && (
        <SeCloPart1 group={selectedGroup} />
      )}

    {finalEvaluationInfo.department === "SE" &&
      finalEvaluationInfo.fypPart === "fyp-2" && (
        <SeCloPart2 group={selectedGroup} />
      )}
  </>
)}

{/* ================= COMMENTS ================= */}
{ week === 4 && selectedGroup && (
  <div className="eval-sup-comments">
    <label>Comments</label>
    <textarea
      rows="4"
      placeholder="Write overall feedback..."
      value={formData.comments || ""}
      onChange={(e) =>
        setFormData((prev) => ({
          ...prev,
          comments: e.target.value,
        }))
      }
    />
  </div>
)}

{/* ================= FOOTER BUTTONS ================= */}
{selectedGroup && (
  <div className="eval-sup-form-footer">
    <button className="eval-sup-cancel-btn" onClick={handleCancel}>
      Cancel
    </button>

    <button className="eval-sup-submit-btn" onClick={handleSubmit}>
      Submit Evaluation
    </button>
  </div>
)}
      </div>
    )}
  </div>
</>
);
}