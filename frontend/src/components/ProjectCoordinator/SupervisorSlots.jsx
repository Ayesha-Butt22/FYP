import React, { useEffect, useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import { toastService } from "../ToastService/ToastService.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import "./SupervisorSlots.css";



const DESIGNATION_DEFAULTS = {
  Dean: 0,
  Professor: 1,
  "Associate Professor": 2,
  "Assistant Professor": 3,
  "Lecturer/Sr. Lecturer": 3,
  "Junior Lecturer": 2,
  "Research Associate/Assistant": 1,
  "Teaching Fellow": 1,
};

const SAMPLE_SUPERVISORS = [
  { id: "sup-001", name: "Ayesha", email: "Ayesha@riphah.edu.pk", department: "CS", speciality: "AI, Cloud", designation: "Lecturer/Sr. Lecturer", availableSlots: 3, bookedSlots: 1 },
  { id: "sup-002", name: "Warda", email: "warda@riphah.edu.pk", department: "SE", speciality: "Web", designation: "Assistant Professor", availableSlots: 5, bookedSlots: 3 },
  { id: "sup-003", name: "Sobia", email: "Sobia@riphah.edu.pk", department: "SE", speciality: "AI", designation: "Junior Lecturer", availableSlots: 2, bookedSlots: 0 },
  { id: "sup-004", name: "Laiba", email: "Laiba@riphah.edu.pk", department: "CS", speciality: "Data Science", designation: "Research Associate/Assistant", /* no availableSlots intentionally */ bookedSlots: 0 },
  { id: "sup-005", name: "Alina", email: "Alina@riphah.edu.pk", department: "CA", speciality: "Cloud", designation: "Teaching Fellow", /* no availableSlots intentionally */ bookedSlots: 0 },
];

const STORAGE_KEY = "pc_supervisor_slots";

export default function SupervisorSlots() {
  const [supervisors, setSupervisors] = useState([]);
  const [editing, setEditing] = useState(null); // { id, name, designation, available, booked }

  // load from localStorage or seed sample data (apply designation defaults where missing)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // normalize and ensure availableSlots come from designation defaults if missing
        const normalized = parsed.map((s) => {
          const defaultSlots = DESIGNATION_DEFAULTS[s.designation] ?? 0;
          return { ...s, availableSlots: typeof s.availableSlots === "number" ? s.availableSlots : defaultSlots, designation: s.designation || "" };
        });
        setSupervisors(normalized);
        return;
      }
    } catch (err) {
      console.warn("Error reading supervisor slots from localStorage:", err);
    }

    // Seed from SAMPLE_SUPERVISORS and ensure defaults applied
    const seeded = SAMPLE_SUPERVISORS.map((s) => {
      const defaultSlots = DESIGNATION_DEFAULTS[s.designation] ?? 0;
      return {
        ...s,
        availableSlots: typeof s.availableSlots === "number" ? s.availableSlots : defaultSlots,
      };
    });
    setSupervisors(seeded);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  }, []);

  // helper to persist current supervisors to localStorage
  const saveToStorage = (updated) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save supervisor slots to localStorage", err);
    }
  };

  const openEdit = (sup) => {
    // derive available slots from designation when opening modal
    const defaultSlots = DESIGNATION_DEFAULTS[sup.designation] ?? 0;
    setEditing({
      id: sup.id,
      name: sup.name,
      designation: sup.designation || "",
      available: defaultSlots,
      booked: sup.bookedSlots,
    });
  };

  const closeEdit = () => setEditing(null);

  const handleDelete = async (sup) => {
    const ok = await Confirm(`Are you sure you want to delete ${sup.name}?`);
    if (!ok) return;
    const updated = supervisors.filter((s) => s.id !== sup.id);
    setSupervisors(updated);
    saveToStorage(updated);
    toastService.success("Supervisor deleted");
  };

  const handleSave = () => {
    if (!editing) return;

    const booked = Number(editing.booked);
    const defaultSlots = DESIGNATION_DEFAULTS[editing.designation] ?? 0;
    const available = defaultSlots; // enforce designation default (not user-editable)

    if (!Number.isInteger(booked) || booked < 0) {
      toastService.error("Booked slots must be a non-negative integer");
      return;
    }
    if (booked > available) {
      toastService.error(`Booked slots (${booked}) cannot exceed available slots (${available}).`);
      return;
    }

    const updated = supervisors.map((s) =>
      s.id === editing.id ? { ...s, availableSlots: available, bookedSlots: booked, designation: editing.designation } : s
    );
    setSupervisors(updated);
    saveToStorage(updated);
    setEditing(null);
    toastService.success("Supervisor slots updated");
  };

  // Column order: Name | Department | Speciality | Designation | Available Slots | Booked Slots
  const headers = ["Name", "Department", "Speciality", "Designation", "Available Slots", "Booked Slots"];

  const rows = supervisors.map((s) => ({
    Name: <strong className="sup-name">{s.name}</strong>,
    Department: s.department,
    Speciality: s.speciality,
    Designation: s.designation || "—",
    "Available Slots": s.availableSlots,
    "Booked Slots": s.bookedSlots,
    __raw: s,
  }));

  const renderActions = (rowObj, index) => {
    const sup = rowObj.__raw || supervisors[index];
    return (
      <>
        <button className="table-action-btn" onClick={() => openEdit(sup)}>
          Edit
        </button>
        <button className="table-action-btn delete" onClick={() => handleDelete(sup)}>
          Delete
        </button>
      </>
    );
  };

  return (
    <>
      <DashboardSectionHeader description={"You can manage supervisor slots and set a fixed limit for how many groups each supervisor can handle. Available slots are now driven by designation and are not editable."}>
        Supervisor Slots
      </DashboardSectionHeader>

      <div className="sup-table-card">
        <AppTable headers={headers} rows={rows} renderActions={renderActions} />
      </div>

      {editing && (
        <div className="sup-edit-backdrop" role="dialog" aria-modal="true">
          <div className="sup-edit-modal" role="document">
            <h3 className="sup-edit-title">Edit Slots — {editing.name}</h3>

            <div className="sup-edit-row">
              <label className="sup-edit-label">Designation</label>
              <select
                className="sup-edit-select"
                value={editing.designation}
                onChange={(e) => {
                  const newDes = e.target.value;
                  const defaultSlots = DESIGNATION_DEFAULTS[newDes] ?? 0;
                  // update designation and reflect its default in available (user can't edit available)
                  setEditing((prev) => ({ ...prev, designation: newDes, available: defaultSlots }));
                }}
              >
                <option value="">-- Select designation --</option>
                {Object.keys(DESIGNATION_DEFAULTS).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="sup-edit-row">
              <label className="sup-edit-label">Available Slots</label>
              {/* disabled input to show derived value; user cannot change */}
              <input
                className="sup-edit-input"
                type="number"
                value={String(editing.available)}
                disabled
                readOnly
              />
            </div>

            <div className="sup-edit-row">
              <label className="sup-edit-label">Booked Slots</label>
              <input
                className="sup-edit-input"
                type="number"
                min="0"
                value={String(editing.booked)}
                onChange={(e) => setEditing((prev) => ({ ...prev, booked: e.target.value }))}
              />
            </div>

            <div className="sup-modal-actions">
              <button className="sup-btn-save" onClick={handleSave}>
                Save
              </button>
              <button className="sup-btn-cancel" onClick={closeEdit}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}