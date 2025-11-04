import React, { useEffect, useState } from "react";
import PresentationService from "../../Api/PresentationService.jsx";
import { DropdownMultiSelect } from "../../Admin/DropDowns.jsx";
import "./Modal.css";
import ToastService from "../../ToastService/ToastService.jsx";

/* Helper: generate contiguous slots of durationMinutes between startTime and endTime for a given date offset */
function generateSlotsForDay(startDateStr, startTimeStr, endTimeStr, durationMinutes = 45, dayOffset = 0) {
  const baseDate = new Date(startDateStr);
  baseDate.setDate(baseDate.getDate() + dayOffset);

  const dateIso = baseDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const startDT = new Date(`${dateIso}T${startTimeStr}:00`);
  const endDT = new Date(`${dateIso}T${endTimeStr}:00`);

  const slots = [];
  let current = new Date(startDT);
  while (current < endDT) {
    const slotEnd = new Date(current.getTime() + durationMinutes * 60 * 1000);
    if (slotEnd > endDT) break;
    slots.push({
      startTime: current.toISOString(),
      endTime: slotEnd.toISOString(),
    });
    current = slotEnd;
  }
  return slots;
}

export default function PresentationModal({ week, onClose, year }) {
  const [faculty, setFaculty] = useState([]);
  const [mode, setMode] = useState("create"); // "create" | "view"
  const [existingSchedules, setExistingSchedules] = useState([]); // now an array
  const [loading, setLoading] = useState(false);

  // batch creation state
  const [panelCount, setPanelCount] = useState(1);
  const [daysCount, setDaysCount] = useState(1);
  const [panelsData, setPanelsData] = useState([]);

  // single/create legacy state (kept for compatibility)
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);
  const [venueSingle, setVenueSingle] = useState("");
  const [slotsSingle, setSlotsSingle] = useState([]);
  const [startTimeSingle, setStartTimeSingle] = useState("");
  const [endTimeSingle, setEndTimeSingle] = useState("");

  // per-schedule slot input state for view-mode (map scheduleId -> { start, end })
  const [slotInputs, setSlotInputs] = useState({});

  const fypPart = year;

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await PresentationService.getFaculty();
        setFaculty(res || []);
      } catch (err) {
        console.error("Error fetching faculty:", err);
      }
    };

    const fetchPresentation = async () => {
      try {
        const res = await PresentationService.getPresentation(week.week, fypPart);
        // res.data is now expected to be an array (per backend change)
        setExistingSchedules(Array.isArray(res?.data) ? res.data : (res?.data ? [res.data] : []));
      } catch (err) {
        console.error("Error fetching presentation:", err);
      }
    };

    fetchFaculty();
    fetchPresentation();
  }, [week.week, fypPart]);

  useEffect(() => {
    // init panelsData when panelCount changes
    setPanelsData((prev) => {
      const next = [...prev];
      while (next.length < panelCount) {
        next.push({ facultyIds: [], venue: "", startDate: "", startTime: "", endTime: "" });
      }
      while (next.length > panelCount) next.pop();
      return next;
    });
  }, [panelCount]);

  const allFacultyLabels = faculty.map((f) => ({ label: `${f.name} (${f.email})`, value: f._id }));

  const updatePanelField = (index, field, value) => {
    setPanelsData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateSlotInput = (scheduleId, field, value) => {
    setSlotInputs(prev => ({ ...prev, [scheduleId]: { ...(prev[scheduleId] || {}), [field]: value } }));
  };

  // legacy single-slot handlers
  const addSlotSingle = () => {
    if (!startTimeSingle || !endTimeSingle) return;
    setSlotsSingle([...slotsSingle, { startTime: startTimeSingle, endTime: endTimeSingle }]);
    setStartTimeSingle("");
    setEndTimeSingle("");
  };
  const removeSlotSingle = (index) => setSlotsSingle(slotsSingle.filter((_, i) => i !== index));

  // Batch save for new panels
  const handleSaveBatch = async () => {
    for (let i = 0; i < panelsData.length; i++) {
      const p = panelsData[i];
      if (!p.facultyIds || p.facultyIds.length === 0) {
        ToastService.error(`Panel ${i + 1}: select at least one faculty`);
        return;
      }
      if (!p.venue) {
        ToastService.error(`Panel ${i + 1}: venue is required`);
        return;
      }
      if (!p.startDate || !p.startTime || !p.endTime) {
        ToastService.error(`Panel ${i + 1}: start date/time and end time are required`);
        return;
      }
      const testSlots = generateSlotsForDay(p.startDate, p.startTime, p.endTime, 45, 0);
      if (testSlots.length === 0) {
        ToastService.error(`Panel ${i + 1}: invalid times or no slots generated (check start/end times)`);
        return;
      }
    }

    const panelsPayload = panelsData.map((p) => {
      let allSlots = [];
      for (let d = 0; d < daysCount; d++) {
        const daySlots = generateSlotsForDay(p.startDate, p.startTime, p.endTime, 45, d);
        allSlots = allSlots.concat(daySlots);
      }
      return {
        facultyPanels: p.facultyIds,
        venue: p.venue,
        slots: allSlots,
      };
    });

    const payload = {
      week: week.week,
      fypPart,
      panels: panelsPayload,
    };

    setLoading(true);
    try {
      const res = await PresentationService.createBatch(payload);
      if (res?.success) {
        ToastService.success("Presentation schedules saved successfully");
        // refresh schedules
        const refreshed = await PresentationService.getPresentation(week.week, fypPart);
        setExistingSchedules(Array.isArray(refreshed?.data) ? refreshed.data : (refreshed?.data ? [refreshed.data] : []));
        onClose();
      } else {
        ToastService.error(res?.message || "Error saving schedules");
      }
    } catch (err) {
      console.error(err);
      ToastService.error("Error saving schedules");
    } finally {
      setLoading(false);
    }
  };

  // legacy single schedule save
  const handleSaveSingle = async () => {
    if (!selectedFacultyIds.length) { ToastService.error("Select faculty panels"); return; }
    if (!venueSingle) { ToastService.error("Enter venue"); return; }
    if (!slotsSingle.length) { ToastService.error("Add at least one slot"); return; }

    const payload = {
      week: week.week,
      fypPart,
      facultyPanels: selectedFacultyIds,
      venue: venueSingle,
      slots: slotsSingle.map(s => ({ startTime: new Date(s.startTime).toISOString(), endTime: new Date(s.endTime).toISOString() })),
    };

    setLoading(true);
    try {
      const res = await PresentationService.createOrUpdate(payload);
      if (res?.success) {
        ToastService.success("Presentation schedule saved successfully");
        const refreshed = await PresentationService.getPresentation(week.week, fypPart);
        setExistingSchedules(Array.isArray(refreshed?.data) ? refreshed.data : (refreshed?.data ? [refreshed.data] : []));
        onClose();
      } else {
        ToastService.error(res?.message || "Error saving schedule");
      }
    } catch (err) {
      console.error(err);
      ToastService.error("Error saving schedule");
    } finally {
      setLoading(false);
    }
  };

  // add single slot to a specific existing schedule (now supports mapping over many schedules)
  const handleAddSlotToSchedule = async (schedule) => {
    const scheduleId = schedule._id;
    const inputs = slotInputs[scheduleId] || {};
    const start = inputs.startTime;
    const end = inputs.endTime;
    if (!start || !end) {
      ToastService.error("Select start and end time for this schedule");
      return;
    }

    const payload = {
      week: week.week,
      fypPart,
      facultyPanels: schedule.facultyPanels.map(f => f._id),
      venue: schedule.venue,
      slots: [{ startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString() }],
    };

    setLoading(true);
    try {
      const res = await PresentationService.createOrUpdate(payload);
      if (res?.success) {
        ToastService.success("Slot added successfully");
        const refreshed = await PresentationService.getPresentation(week.week, fypPart);
        setExistingSchedules(Array.isArray(refreshed?.data) ? refreshed.data : (refreshed?.data ? [refreshed.data] : []));
        setSlotInputs(prev => ({ ...prev, [scheduleId]: { startTime: "", endTime: "" } }));
      } else {
        ToastService.error(res?.message || "Error adding slot");
      }
    } catch (err) {
      console.error(err);
      ToastService.error("Error adding slot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay-week" onClick={onClose}>
      <div className={`modal-content ${mode === "view" ? "" : "large"}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label><b>Manage Slots - {week.week}</b></label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button style={{ width: 100 }} onClick={() => setMode(mode === "view" ? "create" : "view")} className="btn main-btn">
              {mode === "view" ? "Create" : "View"}
            </button>
          </div>
        </div>

        {/* VIEW MODE: show all schedules for the week */}
        {mode === "view" ? (
          <>
            {existingSchedules.length === 0 ? (
              <div style={{ padding: 18 }}>No schedules found for this week.</div>
            ) : (
              <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
                {existingSchedules.map((sched) => (
                  <div key={sched._id} style={{ border: "1px solid #e6eefc", borderRadius: 8, padding: 12, marginBottom: 12, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h4 style={{ margin: 0 }}>{sched.venue} — {sched.fypPart}</h4>
                        <div style={{ color: "#555" }}>
                          Faculty: {sched.facultyPanels.map(f => `${f.name} (${f.email})`).join(", ")}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <strong>Slots:</strong>
                      <ul style={{ marginTop: 8 }}>
                        {sched.slots.map((s, i) => (
                          <li key={s._id || i} style={{ padding: "6px 0" }}>
                            {new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleString()}
                            {s.bookedBy ? ` — Booked (${s.bookedBy.groupId})` : " — Available"}
                          </li>
                        ))}
                      </ul>
                    </div>

                
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={onClose} className="btn close">Close</button>
            </div>
          </>
        ) : (
          /* CREATE / BATCH MODE */
          <>
            <div className="modal-header" style={{ marginTop: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <label style={{ fontSize: 13, color: "#666" }}>Days:</label>
                <input type="number" min="1" value={daysCount} onChange={(e) => setDaysCount(Math.max(1, parseInt(e.target.value || 1)))} style={{ width: 80, padding: 6 }} />
                <label style={{ fontSize: 13, color: "#666" }}>Panels:</label>
                <input type="number" min="1" value={panelCount} onChange={(e) => setPanelCount(Math.max(1, parseInt(e.target.value || 1)))} style={{ width: 80, padding: 6 }} />
              </div>
            </div>

            <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
              {panelsData.map((panel, idx) => (
                <div key={idx} style={{ border: "1px solid #e6eefc", borderRadius: 8, padding: 12, marginBottom: 12, background: "#fff" }}>
                  <h4 style={{ margin: "0 0 10px 0" }}>Panel {idx + 1}</h4>

                  <div className="form-group">
                    <label className="form-label">Faculty Panels:</label>
                    <DropdownMultiSelect
                      value={panel.facultyIds.map(id => {
                        const f = faculty.find(ff => ff._id === id);
                        return f ? `${f.name} (${f.email})` : "";
                      })}
                      options={allFacultyLabels.map(o => o.label)}
                      onChange={(selectedLabels) => {
                        const selectedIds = faculty
                          .filter((f) => selectedLabels.includes(`${f.name} (${f.email})`))
                          .map((f) => f._id);
                        updatePanelField(idx, "facultyIds", selectedIds);
                      }}
                      placeholder="Select faculty members"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Venue:</label>
                    <input type="text" className="form-input" value={panel.venue} onChange={(e) => updatePanelField(idx, "venue", e.target.value)} placeholder="Enter venue" />
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Start Date:</label>
                      <input type="date" className="form-input" value={panel.startDate} onChange={(e) => updatePanelField(idx, "startDate", e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Start Time:</label>
                      <input type="time" className="form-input" value={panel.startTime} onChange={(e) => updatePanelField(idx, "startTime", e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">End Time:</label>
                      <input type="time" className="form-input" value={panel.endTime} onChange={(e) => updatePanelField(idx, "endTime", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
              <button onClick={onClose} className="btn close">Cancel</button>
              <button onClick={handleSaveBatch} className="btn main-btn" disabled={loading}>{loading ? "Saving..." : "Save All"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}