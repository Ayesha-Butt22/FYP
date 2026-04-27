import React, { useEffect, useState } from "react";
import "./CommitteeEvaluation.css";
import EvaluationService from "../Api/EvaluationService.jsx";
import ToastService from "../ToastService/ToastService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import CsCloPart1 from "./CS part-1/CsCloPart1.jsx";
import CsCloPart2 from "./CS part-2/CsCloPart2.jsx";
import SeCloPart1 from "./SE part-1/SeCloPart1.jsx";
import SeCloPart2 from "./SE part-2/SeCloPart2.jsx";
import SlotBookingModal from "../Student/Modal/SlotsBookingModal.jsx";

// Centralized API configuration for this component
const BACKEND_URL = "http://localhost:5000";
const API_BASE = `${BACKEND_URL}/api/committee-evaluation`;

export default function CommitteeEvaluation() {
  const [facultyData, setFacultyData] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);
  const [week, setWeek] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [finalEvaluationInfo, setFinalEvaluationInfo] = useState(null);
  const [cloMarks, setCloMarks] = useState(null);
  const [submittedSlotIds, setSubmittedSlotIds] = useState([]);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState(null);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedBookingGroup, setSelectedBookingGroup] = useState("");
  const loggedEmail = localStorage.getItem("email");
  const isSupervisor = (selectedGroup?.project?.projectSupervisor === loggedEmail);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const maskGroupId = (groupId) => {
    if (!groupId) return "";
    const str = String(groupId);
    // If it looks like a 24-character hexadecimal MongoDB ObjectId, mask it
    if (/^[0-9a-fA-F]{24}$/.test(str)) {
      return `Group-${str.slice(-5)}`;
    }
    // Otherwise it's already a formatted string, keep it as is
    return str;
  };

  const handleCloSubmit = (marks, total) => {
    setCloMarks({ marks, total });
    ToastService.success(`CLO Marks captured: ${total}/100`);
  };

  const safeFetchJSON = async (url, options = {}) => {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response received:", text);
      throw new Error(`Expected JSON but received ${contentType || 'text'}. Server might be down or route missing.`);
    }
    return response.json();
  };

  // ─── Resolve department + FYP part for CLO rubric selection ──────────────
  const resolveFinalEvaluation = async (groupId) => {
    try {
      const data = await safeFetchJSON(`${API_BASE}/resolve-final-evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (data.success) {
        setFinalEvaluationInfo(data);
      }
      // Silently ignore non-success — don't show error toast on page load
    } catch (err) {
      console.error("resolveFinalEvaluation Error:", err);
    }
  };

  // ─── Fetch panels this faculty is assigned to ─────────────────────────────
  useEffect(() => {
    const fetchFacultyPanel = async () => {
      try {
        setLoading(true);
        const email = localStorage.getItem("email");
        if (!email) return;

        // Note: checkFaculty resides in the other router /api/evaluation
        const result = await safeFetchJSON(`${BACKEND_URL}/api/evaluation/checkFaculty`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (result?.success && Array.isArray(result?.data) && result.data.length > 0) {
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

  // ─── Fetch already-submitted slot IDs for this faculty ───────────────────
  useEffect(() => {
    const fetchMySubmissions = async () => {
      const facultyId = localStorage.getItem("id") || localStorage.getItem("userId");
      if (!facultyId) return;
      try {
        const data = await safeFetchJSON(`${API_BASE}/my-submissions/${facultyId}`);
        if (data.success) {
          setSubmittedSlotIds(data.submittedSlotIds || []);
        }
      } catch (err) {
        console.error("Error fetching my submissions:", err);
      }
    };
    fetchMySubmissions();
  }, []);

  // ─── Load group for a slot ────────────────────────────────────────────────
  const handleCheckGroup = async (slot, panel) => {
    try {
      setLoading(true);
      setFinalEvaluationInfo(null);
      setCloMarks(null);

      setActiveSlot({ ...slot, panel });
      setWeek(panel.week);
      setSchedule(panel._id);

      const bookedRes = await EvaluationService.getSingleGroups({
        scheduleId: panel._id,
        slotId: slot._id,
      });

      if (bookedRes?.success && bookedRes.data?.length > 0) {
        const group = bookedRes.data[0];
        setSelectedGroup(group);

        await resolveFinalEvaluation(group.groupId);


        const initialForm = {};
        group.members?.forEach((m) => {
          initialForm[m.studentId] = {
            presentation: "",
            performance: "",
            supervisorMarks: "",
            supervisorReason: ""
          };
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
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (field === "supervisorMarks") {
        const num = parseFloat(value);
        if (num > 15) return ToastService.warning("Maximum supervisor marks are 15");
      }
      setFormData((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], [field]: value },
      }));
    }
  };

  const handleFieldChange = (studentId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  // ─── Submit evaluation ────────────────────────────────────────────────────
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

      // Robust Week 4 check (handles "Week 4", "WEEK 4", etc.)
      const isWeek4 = /week\s*4/i.test(week);

      if (!isWeek4 && !cloMarks) {
        ToastService.warning("Please fill and submit the CLO Rubric before submitting evaluation.");
        return;
      }

      if (isWeek4 && !formData.comments?.trim()) {
        ToastService.warning("Please provide comments/feedback for the Week 4 progress presentation.");
        return;
      }

      if (!isWeek4 && (!cloMarks || !cloMarks.marks || !cloMarks.marks.lo1)) {
        ToastService.warning("Required: Please ensure FYP-LO1 is evaluated in the rubric before final submission.");
        return;
      }

      const students = selectedGroup.members.map((m) => ({
        studentId: m.studentId,
        name: m.name,
        presentationMarks: parseFloat(formData[m.studentId]?.presentation) || 0,
        performanceMarks: parseFloat(formData[m.studentId]?.performance) || 0,
        supervisorIndividualMarks: parseFloat(formData[m.studentId]?.supervisorMarks) || 0,
        supervisorIndividualReason: formData[m.studentId]?.supervisorReason || "",
      }));

      const payload = {
        scheduleId: schedule,
        slotId: activeSlot._id,
        groupId: selectedGroup.groupMongoId,
        evaluatedBy,
        comments: formData.comments || "",
        students,
        cloMarks: cloMarks?.marks || null,
        totalCloMarks: cloMarks?.total || 0,
      };

      setLoading(true);

      const result = await safeFetchJSON(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (result.success) {
        ToastService.success("Evaluation submitted successfully!");
        const slotIdStr = activeSlot._id?.toString();
        if (slotIdStr) {
          setSubmittedSlotIds((prev) => [...new Set([...prev, slotIdStr])]);
        }
        setSelectedGroup(null);
        setActiveSlot(null);
        setCloMarks(null);
        setFormData({});
      } else if (result.message?.toLowerCase().includes("already")) {
        // Already submitted — mark as submitted locally but don't re-show error
        ToastService.warning(result.message || "Already submitted for this slot.");
        const slotIdStr = activeSlot._id?.toString();
        if (slotIdStr) setSubmittedSlotIds((prev) => [...new Set([...prev, slotIdStr])]);
        setSelectedGroup(null);
        setActiveSlot(null);
      } else {
        ToastService.error(result.message || "Failed to submit evaluation.");
      }
    } catch (err) {
      console.error("Submit Evaluation Error:", err);
      ToastService.error(err.message || "Server error while submitting evaluation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedGroup(null);
    setActiveSlot(null);
    setCloMarks(null);
  };

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (loading) return <div className="eval-sup-loading">Loading...</div>;

  if (!facultyData)
    return (
      <>
        
        <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>
          You are not assigned to any active evaluation panel right now.
        </div>
      </>
    );

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <>
      <DashboardSectionHeader description="Committee members can evaluate student groups and submit overall performance evaluations">
       Committe Evaluation
      </DashboardSectionHeader>

      <div className="eval-sup-container">

        {/* ═══════════════ PANEL SLOTS LIST ═══════════════ */}
        {facultyData.map((panel, i) => (
          <div key={i} className="eval-sup-panel">
            <div className="eval-sup-header">
              <p>
                <strong>Week:</strong> {panel.week} &nbsp;|&nbsp;
                <strong>FYP Part:</strong> {panel.fypPart?.toUpperCase()} &nbsp;|&nbsp;
                <strong>Venue:</strong> {panel.venue}
              </p>
            </div>

            <div className="eval-sup-slots-grid">
              {panel.slots?.map((slot, idx) => {
                const slotDate = new Date(slot.startTime);
                const dateStr = slotDate.toLocaleDateString([], {
                  weekday: "short", month: "short", day: "numeric",
                });
                const startTime = slotDate.toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit",
                });
                const endTime = new Date(slot.endTime).toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit",
                });

                const groupRawId = slot.bookedBy?._id || slot.bookedBy;
                const bookedByLabel = slot.bookedBy
                  ? maskGroupId(String(slot.bookedBy?.groupId || slot.bookedBy?._id || slot.bookedBy))
                  : null;
                const isGroupArchived = slot.bookedBy?.isArchived;

                // ── Enhanced deduplication check ──
                // If this faculty already submitted for this specific SLOT
                const selfSubmitted = submittedSlotIds.includes(slot._id?.toString());

                // OR if they submitted for this same GROUP in another slot for the SAME week/part
                const groupAlreadySubmittedInMilestone = groupRawId && facultyData.some(p =>
                  p.week === panel.week &&
                  p.fypPart === panel.fypPart &&
                  p.slots?.some(s =>
                    (s.bookedBy?._id === groupRawId || s.bookedBy === groupRawId) &&
                    submittedSlotIds.includes(s._id?.toString())
                  )
                );

                const showAsSubmitted = selfSubmitted || groupAlreadySubmittedInMilestone;

                // --- Date Pass Check (Strictly Date, Not Time) ---
                const now = new Date();
                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const slotMidnight = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate()).getTime();
                const isDatePassed = todayMidnight > slotMidnight;

                return (
                  <div key={idx} className="eval-sup-slot-card eval-sup-free">
                    <div className="eval-sup-slot-time">
                      <span className="eval-sup-slot-date">{dateStr}</span>
                      <br />
                      {startTime} – {endTime}
                    </div>

                    {bookedByLabel && (
                      <div className="eval-sup-booked-group">
                        {bookedByLabel} {isGroupArchived && <span style={{fontSize: "0.85em", color: "#64748b"}}>(Archived)</span>}
                      </div>
                    )}

                    {bookedByLabel ? (
                      showAsSubmitted ? (
                        <div className="eval-sup-submitted-badge">✅ Submitted</div>
                      ) : (
                        <button
                          className="eval-sup-open-btn"
                          onClick={() => handleCheckGroup(slot, panel)}
                        >
                          Evaluate
                        </button>
                      )
                    ) : (
                      <div className="eval-sup-unbooked">
                        <p>Not Booked</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ═══════════════ MODAL OVERLAY ═══════════════ */}
        {selectedGroup && (
          <div className="eval-sup-modal-overlay" onClick={handleCancel}></div>
        )}

        {/* ═══════════════ EVALUATION FORM (CENTERED MODAL) ═══════════════ */}
        {selectedGroup && (
          <div className="eval-sup-form-container">

            <div className="eval-sup-form-header">
              <h3>Evaluate Group: {maskGroupId(selectedGroup.groupId)}</h3>
              <button className="eval-sup-close-btn" onClick={handleCancel}>✕</button>
            </div>

            {selectedGroup.project && (
              <div className="eval-sup-form-info">
                <p><b>Project Title:</b> {selectedGroup.project.projectTitle || "—"}</p>
                <p><b>Project Description:</b> {selectedGroup.project.projectDescription || "—"}</p>
                <p><b>Project Tools:</b> {selectedGroup.project.projectTools || "—"}</p>
                <p><b>Project Supervisor:</b> {selectedGroup.project.projectSupervisor || "—"}</p>
              </div>
            )}

            {activeSlot && (
              <div className="eval-sup-form-info">
                <p>
                  <strong>Slot:</strong>{" "}
                  {new Date(activeSlot.startTime).toLocaleDateString()}{" "}
                  {new Date(activeSlot.startTime).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {new Date(activeSlot.endTime).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                {selectedGroup.proposalTitle && (
                  <p><strong>Proposal:</strong> {selectedGroup.proposalTitle}</p>
                )}
              </div>
            )}

            {/* 1. Show standard marks table for non-final weeks (EXCLUDING Week 4) */}

            {/* 2. Render appropriate CLO Rubric button based on Eligibility (Robust Week 4 check) */}
            {finalEvaluationInfo && !/week\s*4/i.test(week) && (() => {
              // Prioritize the Panel's FYP Part for the rubric selection
              const currentSlotFypPart = (activeSlot?.panel?.fypPart || "fyp-1").toLowerCase();
              const isFyp2Slot = currentSlotFypPart === "fyp-2";
              const isEligibleForFyp2 = !!finalEvaluationInfo.eligibility?.isEligibleForFyp2;

              const effectivePart = (activeSlot?.panel?.fypPart || finalEvaluationInfo?.fypPart || "fyp-1").toLowerCase().replace("-", "");
              const isPart1 = effectivePart === "fyp1" || effectivePart === "fyp-1" || effectivePart === "part1";
              const isPart2 = effectivePart === "fyp2" || effectivePart === "fyp-2" || effectivePart === "part2";

              const deptStr = finalEvaluationInfo.department?.toUpperCase() || "";

              // Flexible detection: SE/CS
              const isSE = /SE|SOFTWARE/i.test(deptStr);
              const isCS = /CS|COMPUTER/i.test(deptStr);

              // 🚫 If it's an FYP-2 slot but the group is not eligible, show error message
              if (isFyp2Slot && !isEligibleForFyp2) {
                return (
                  <div className="eval-sup-not-eligible">
                    <h4>🚫 Group Not Eligible for FYP-2</h4>
                    <p>Eligibility requirements have not been met for this group:</p>
                    <div className="eligibility-checklist">
                      <div className={`checklist-item ${finalEvaluationInfo.eligibility?.templatesApproved ? 'passed' : 'failed'}`}>
                        {finalEvaluationInfo.eligibility?.templatesApproved ? "✅" : "❌"} 5 Approved Templates
                      </div>
                      <div className={`checklist-item ${finalEvaluationInfo.eligibility?.week4Cleared ? 'passed' : 'failed'}`}>
                        {finalEvaluationInfo.eligibility?.week4Cleared ? "✅" : "❌"} FYP-1 Week 4 Evaluation Completed
                      </div>
                      <div className={`checklist-item ${finalEvaluationInfo.eligibility?.week16Cleared ? 'passed' : 'failed'}`}>
                        {finalEvaluationInfo.eligibility?.week16Cleared ? "✅" : "❌"} FYP-1 Week 16 Evaluation Completed
                      </div>
                    </div>
                    <p className="eligibility-footer">
                      Evaluations for FYP-2 (Week 14/16) are restricted until all Part-1 components are cleared.
                    </p>
                  </div>
                );
              }

              return (
                <div style={{ marginBottom: '20px' }}>
                  {/* Status Info (Helps supervisor see which rubric is active) */}
                  <div className="eval-sup-eligibility-info">
                    <p>
                      <strong>Evaluation Target:</strong> {deptStr || "N/A"} | {isPart1 ? "FYP-1 (Week 16)" : "FYP-2 (Week 14)"}
                    </p>
                  </div>

                  {isCS && (
                    <>
                      {isPart1 && <CsCloPart1 group={selectedGroup} onMarksSubmit={handleCloSubmit} />}
                      {isPart2 && <CsCloPart2 group={selectedGroup} onMarksSubmit={handleCloSubmit} />}
                    </>
                  )}
                  {isSE && (
                    <>
                      {isPart1 && <SeCloPart1 group={selectedGroup} onMarksSubmit={handleCloSubmit} />}
                      {isPart2 && <SeCloPart2 group={selectedGroup} onMarksSubmit={handleCloSubmit} />}
                    </>
                  )}
                </div>
              );
            })()}

            {cloMarks && (
              <div className="eval-sup-clo-captured">
                ✅ CLO Marks captured: <strong>{cloMarks.total}/100</strong>
              </div>
            )}

            <div className="eval-sup-comments">
              <label>Comments</label>
              <textarea
                rows="4"
                placeholder="Write overall feedback..."
                value={formData.comments || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, comments: e.target.value }))
                }
              />
            </div>

            <div className="eval-sup-form-footer">
              <button className="eval-sup-cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button className={`eval-sup-submit-btn pulsing`} onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting…" : "Submit Evaluation"}
              </button>
            </div>

          </div>
        )}
      </div>
      {slotModalOpen && (
        <SlotBookingModal
          open={slotModalOpen}
          onClose={() => setSlotModalOpen(false)}
          slots={availableSlots.availableSlots}
          groupId={null}
          scheduleId={availableSlots.scheduleId}
          data={availableSlots.wholeData}
        />
      )}
    </>
  );
}