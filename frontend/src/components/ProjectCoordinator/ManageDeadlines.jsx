import React, { useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import { toastService } from "../ToastService/ToastService.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import {
  Select,
  MenuItem,
  TextField
} from "@mui/material";
import "./ManageDeadlines.css";

const SESSIONS = ["Fall", "Spring"];
const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

const WEEKS = [
  "Week 1", "Week 2", "Week 3", "Week 4", "Week 5",
  "Week 6", "Week 7", "Week 8", "Week 9", "Week 10",
  "Week 11", "Week 12", "Week 13", "13th Week (before Final Exams)",
  "Week 14", "Week 15", "Week After Finals"
];

const TEMPLATES = [
  { id: "t01", label: "Template-01: Project Team (MS Word)" },
  { id: "t02", label: "Template-02: Initial Proposal (MS Word)" },
  { id: "t03", label: "Template-03: Proposal Presentation (PowerPoint)" },
  { id: "t04", label: "Template-04: Proposal & Plan (MS Word)" },
  { id: "t05", label: "Template-05: Project Report (MS Word)" },
  { id: "t06", label: "Template-06: Final Presentation (PowerPoint)" },
  { id: "t07", label: "Template-07: Progress Presentation (PowerPoint)" },
];

const createEmptyRow = () => ({
  id: Date.now() + Math.random(),
  Session: "Fall",
  Year: 2025,
  Week: "Week 1",
  Template: TEMPLATES[0].label,
  "Last Submission": ""
});

function FormInput({ label, error, children }) {
  return (
    <div className="form-group">
      <label>
        {label} <span style={{ color: '#f43f5e' }}>*</span>
      </label>
      {children}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export default function ManageDeadlines() {
  const [rows, setRows] = useState([createEmptyRow()]);
  const [sideFormMode, setSideFormMode] = useState(null); // 'add' | 'edit' | null
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState(createEmptyRow());
  const [formErrors, setFormErrors] = useState({});

  const headers = ["Session", "Year", "Week", "Template", "Last Submission"];

  const resetForm = () => {
    setFormData(createEmptyRow());
    setFormErrors({});
    setSideFormMode(null);
    setEditIndex(null);
  };

  const openAddForm = () => {
    resetForm();
    setSideFormMode('add');
  };

  const handleEdit = (row, idx) => {
    setEditIndex(idx);
    setFormData({ ...row });
    setFormErrors({});
    setSideFormMode('edit');
  };

  const handleDelete = async (idx) => {
    const confirmed = await Confirm("Are you sure you want to delete this deadline?");
    if (!confirmed) return;
    setRows(prev => prev.filter((_, i) => i !== idx));
    toastService.success("Deadline deleted");
    if (sideFormMode === 'edit' && editIndex === idx) resetForm();
  };

  const validate = (data) => {
    const errors = {};
    if (!data.Session) errors.Session = "Session is required";
    if (!data.Year) errors.Year = "Year is required";
    if (!data.Week) errors.Week = "Week is required";
    if (!data.Template) errors.Template = "Template is required";
    if (!data["Last Submission"]) errors["Last Submission"] = "Submission date is required";
    return errors;
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    const errors = validate(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (sideFormMode === 'add') {
      setRows(prev => [{ ...formData, id: Date.now() + Math.random() }, ...prev]);
      toastService.success("Deadline added");
      resetForm();
    } else if (sideFormMode === 'edit') {
      setRows(prev => {
        const updatedRows = [...prev];
        updatedRows[editIndex] = { ...formData };
        return updatedRows;
      });
      toastService.success("Deadline updated");
      resetForm();
    }
  };

  const tableRows = rows.map(r => ({ ...r }));

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100vh' }}>
      <div style={{ flex: 2 }}>
        <DashboardSectionHeader description={"Define semester/session templates and set the final submission weeks/dates for your department."}>
          Manage Deadlines
        </DashboardSectionHeader>

        <div style={{ display: "flex", justifyContent: "right", margin: "20px 0" }}>
          <button
            className="add-supervisor-btn"
            onClick={openAddForm}
            disabled={sideFormMode === 'add'}
          >
            + Add Deadline
          </button>
        </div>

        <div style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          <AppTable
            headers={headers}
            rows={tableRows}
            renderActions={(row, i) => (
              <>
                <button
                  className="table-action-btn"
                  onClick={() => handleEdit(row, i)}
                  disabled={sideFormMode && editIndex === i}
                >
                  {sideFormMode && editIndex === i ? 'Editing...' : 'Edit'}
                </button>
                <button
                  className="table-action-btn"
                  style={{ background: "#f43f5e" }}
                  onClick={() => handleDelete(i)}
                  disabled={sideFormMode}
                >
                  Delete
                </button>
              </>
            )}
          />
        </div>
      </div>

      {sideFormMode && (
        <div
          style={{
            flex: '1',
            minWidth: '360px',
            maxWidth: '460px',
            backgroundColor: '#f8f9fa',
            padding: '18px',
            borderRadius: '8px',
            boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '2px solid #e9ecef'
            }}
          >
            <h3 style={{ margin: 0, color: '#01337a', fontSize: '1.05rem' }}>
              {sideFormMode === 'edit' ? 'Edit Deadline' : 'Add Deadline'}
            </h3>
            <button
              onClick={resetForm}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSave}>
            <FormInput label="Session" error={formErrors.Session}>
              <Select
                value={formData.Session}
                onChange={(e) => handleFormChange("Session", e.target.value)}
                size="small"
                fullWidth
              >
                {SESSIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormInput>

            <FormInput label="Year" error={formErrors.Year}>
              <Select
                value={formData.Year}
                onChange={(e) => handleFormChange("Year", e.target.value)}
                size="small"
                fullWidth
              >
                {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormInput>

            <FormInput label="Week" error={formErrors.Week}>
              <Select
                value={formData.Week}
                onChange={(e) => handleFormChange("Week", e.target.value)}
                size="small"
                fullWidth
                MenuProps={{ PaperProps: { style: { maxHeight: 240 } } }}
              >
                {WEEKS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </Select>
            </FormInput>

            <FormInput label="Template" error={formErrors.Template}>
              <Select
                value={formData.Template}
                onChange={(e) => handleFormChange("Template", e.target.value)}
                size="small"
                fullWidth
                MenuProps={{ PaperProps: { style: { maxHeight: 320 } } }}
              >
                {TEMPLATES.map(t => <MenuItem key={t.id} value={t.label}>{t.label}</MenuItem>)}
              </Select>
            </FormInput>

            <FormInput label="Last Submission" error={formErrors["Last Submission"]}>
              <TextField
                type="date"
                value={formData["Last Submission"]}
                onChange={(e) => handleFormChange("Last Submission", e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </FormInput>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="submit"
                className="table-action-btn"
                style={{
                  flex: 1,
                  fontWeight: 800,
                  backgroundColor: '#01337a'
                }}
              >
                {sideFormMode === 'edit' ? 'Update' : 'Save'}
              </button>

              <button
                type="button"
                className="table-action-btn"
                style={{
                  flex: 1,
                  background: "#6c757d",
                  fontWeight: 800
                }}
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
