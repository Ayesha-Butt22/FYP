// src/components/PresentationModal.jsx
import React, { useEffect, useState } from "react";
import PresentationService from "../../Api/PresentationService.jsx";
import { DropdownMultiSelect } from "../../Admin/DropDowns.jsx";
import "./Modal.css";
import ToastService from "../../ToastService/ToastService.jsx";


function generateSlotsForDay(startDateStr, startTimeStr, endTimeStr, durationMinutes = 45, dayOffset = 0) {
  const baseDate = new Date(startDateStr);
  baseDate.setDate(baseDate.getDate() + dayOffset);
  const dateIso = baseDate.toISOString().slice(0, 10);
  const startDT = new Date(`${dateIso}T${startTimeStr}:00`);
  const endDT = new Date(`${dateIso}T${endTimeStr}:00`);

  const slots = [];
  let current = new Date(startDT);
  while (current < endDT) {
    const slotEnd = new Date(current.getTime() + durationMinutes * 60 * 1000);
    if (slotEnd > endDT) break;
    slots.push({ startTime: current.toISOString(), endTime: slotEnd.toISOString() });
    current = slotEnd;
  }
  return slots;
}

export default function PresentationModal({ week, onClose, year }) {
  const [faculty, setFaculty] = useState([]);
  const [mode, setMode] = useState("create"); // create | view
  const [existingSchedules, setExistingSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const [panelCount, setPanelCount] = useState(1);
  const [daysCount, setDaysCount] = useState(1);
  const [slotDuration, setSlotDuration] = useState(45);

  const [panelsData, setPanelsData] = useState([]); // each: { facultyIds: [], venue, startDate, startTime, endTime }

  const fypPart = year;

  useEffect(() => {
    async function load() {
      try {
        const f = await PresentationService.getFaculty();
        const data =  f.data;
        setFaculty(data || []);
      } catch (err) {
        console.error(err);
      }

      try {
        const pres = await PresentationService.getPresentation(week.week, fypPart);
        setExistingSchedules(Array.isArray(pres?.data) ? pres.data : (pres?.data ? [pres.data] : []));
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [week.week, fypPart]);

  useEffect(() => {
    setPanelsData(prev => {
      const next = [...prev];
      while (next.length < panelCount) {
        next.push({ facultyIds: [], venue: "", startDate: "", startTime: "", endTime: "" });
      }
      while (next.length > panelCount) next.pop();
      return next;
    });
  }, [panelCount]);

  const allFacultyLabels = faculty.map(f => ({ label: `${f.name} (${f.email})`, value: f._id }));

  const usedFacultyIds = panelsData.flatMap(p => p.facultyIds);
  
  const availableFacultyLabels = allFacultyLabels.filter(f => !usedFacultyIds.includes(f.value));

  const updatePanelField = (index, field, value) => {
    setPanelsData(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveBatch = async () => {

    for (let i = 0; i < panelsData.length; i++) {
      const p = panelsData[i];
      if (!p.facultyIds || p.facultyIds.length === 0) {
        ToastService.error(`Panel ${i + 1}: select at least one faculty`);
        return;
      }
      if (!p.venue || !p.startDate || !p.startTime || !p.endTime) {
        ToastService.error(`Panel ${i + 1}: fill venue/start-date/start-time/end-time`);
        return;
      }
    }

  
    const panelsPayload = panelsData.map(p => {
      let allSlots = [];
      for (let d = 0; d < daysCount; d++) {
        const daySlots = generateSlotsForDay(p.startDate, p.startTime, p.endTime, slotDuration, d);
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
      durationMinutes: slotDuration,
      panels: panelsPayload,
    };

    setLoading(true);
    try {
      const res = await PresentationService.createBatch(payload);
      if (res?.success) {
        ToastService.success("Schedules saved");
        const refreshed = await PresentationService.getPresentation(week.week, fypPart);
        setExistingSchedules(Array.isArray(refreshed?.data) ? refreshed.data : (refreshed?.data ? [refreshed.data] : []));
        onClose();
      } else {
        ToastService.error(res?.message || "Error saving schedules");
      }
    } catch (err) {
      console.error(err);
      ToastService.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay-week" onClick={onClose}>
      <div className={`modal-content ${mode === "view" ? "" : "large"}`} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label><b>Manage Slots - {week.week}</b></label>
          <button className="btn main-btn" onClick={() => setMode(mode === "view" ? "create" : "view")}>
            {mode === "view" ? "Create" : "View"}
          </button>
        </div>

        {mode === "view" ? (
          <>
            {existingSchedules.length === 0 ? (
              <div style={{ padding: 18 }}>No schedules found.</div>
            ) : (
              <div style={{ maxHeight: "65vh", overflowY: "auto" }}>
                {existingSchedules.map(sched => (
                  <div key={sched._id} style={{ border: "1px solid #e6eefc", borderRadius: 8, padding: 12, marginBottom: 12, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h4 style={{ margin: 0 }}>{sched.venue} — {sched.fypPart}</h4>
                        <div style={{ color: "#555" }}>Faculty: {sched.facultyPanels.map(f => `${f.name} (${f.email})`).join(", ")}</div>
                      </div>

                      <div>
                        {sched.isPublish ? (
                          <span style={{ padding: "6px 10px", background: "#e6ffe6", borderRadius: 6 }}>Published</span>
                        ) : (
                          <button
                            className="btn main-btn"
                            onClick={async () => {
                              try {
                                const res = await PresentationService.publishSchedule(sched._id);
                                if (res.success) {
                                  ToastService.success("Published");
                                  const refreshed = await PresentationService.getPresentation(week.week, fypPart);
                                  setExistingSchedules(Array.isArray(refreshed?.data) ? refreshed.data : (refreshed?.data ? [refreshed.data] : []));
                                }
                              } catch (err) {
                                console.error(err);
                                ToastService.error("Error publishing");
                              }
                            }}
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <strong>Slots:</strong>
                      <ul style={{ marginTop: 8 }}>
                        {sched.slots.map((s, i) => (
                          <li key={s._id || i} style={{ padding: "6px 0" }}>
                            {new Date(s.startTime).toLocaleString()} — {new Date(s.endTime).toLocaleString()}
                            {s.bookedBy ? ` — Booked (${s.bookedBy.groupId || s.bookedBy})` : " — Available"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button className="btn close" onClick={onClose}>Close</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 12, marginTop: 8, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: "#666" }}>Days:</label><br />
                <input type="number" min="1" value={daysCount} onChange={e => setDaysCount(Math.max(1, parseInt(e.target.value || 1)))} style={{ width: 80, padding: 6 }} />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#666" }}>Panels:</label><br />
                <input type="number" min="1" value={panelCount} onChange={e => setPanelCount(Math.max(1, parseInt(e.target.value || 1)))} style={{ width: 80, padding: 6 }} />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#666" }}>Duration (min):</label><br />
                <input type="number" min="10" value={slotDuration} onChange={e => setSlotDuration(Math.max(5, parseInt(e.target.value || 45)))} style={{ width: 100, padding: 6 }} />
              </div>
            </div>

            <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
              {panelsData.map((panel, idx) => (
                <div key={idx} style={{ border: "1px solid #e6eefc", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <h4 style={{ marginTop: 0 }}>Panel {idx + 1}</h4>

                  <div className="form-group">
                    <label className="form-label">Faculty Panels:</label>
                    <DropdownMultiSelect
                      value={panel.facultyIds.map(id => {
                        const f = faculty.find(ff => ff._id === id);
                        return f ? `${f.name} (${f.email})` : "";
                      })}
                      options={availableFacultyLabels.map(a => a.label)}
                      onChange={(labels) => {
                        // map labels back to ids
                        const selectedIds = faculty.filter(f => labels.includes(`${f.name} (${f.email})`)).map(f => f._id);
                        updatePanelField(idx, "facultyIds", selectedIds);
                      }}
                      placeholder="Select faculty members"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Venue:</label>
                    <input type="text" className="form-input" value={panel.venue} onChange={e => updatePanelField(idx, "venue", e.target.value)} placeholder="Enter venue" />
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label>Start Date</label>
                      <input type="date" className="form-input" value={panel.startDate} onChange={e => updatePanelField(idx, "startDate", e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Start Time</label>
                      <input type="time" className="form-input" value={panel.startTime} onChange={e => updatePanelField(idx, "startTime", e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>End Time</label>
                      <input type="time" className="form-input" value={panel.endTime} onChange={e => updatePanelField(idx, "endTime", e.target.value)} />
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <strong>Preview (first day):</strong>
                    <ul>
                      {panel.startDate && panel.startTime && panel.endTime ? generateSlotsForDay(panel.startDate, panel.startTime, panel.endTime, slotDuration, 0).map((s, i) => (
                        <li key={i}>{new Date(s.startTime).toLocaleString()} — {new Date(s.endTime).toLocaleString()}</li>
                      )) : <li style={{ color: "#888" }}>Fill date/time to preview</li>}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button className="btn close" onClick={onClose}>Cancel</button>
              <button className="btn main-btn" onClick={handleSaveBatch} disabled={loading}>{loading ? "Saving..." : "Save All"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
