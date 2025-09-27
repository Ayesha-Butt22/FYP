import React, { useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import "../Admin/Modal&Button.css";

// --- Reusable input for form fields ---
function FormInput({ label, error, ...props }) {
  return (
    <div className="form-group">
      <label>{label} {props.required && <span style={{color: '#f43f5e'}}>*</span>}</label>
      <input {...props} style={{ borderColor: error ? '#f43f5e' : '#dbdbec' }} />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

const headers = ["Name", "Email"];
const initialRows = [
  {
    Name: "System Admin",
    Email: "admin@riphah.edu.pk",
    Password: "admin123"
  },
  {
    Name: "Ayesha Butt",
    Email: "ayesha.butt@riphah.edu.pk",
    Password: "ayesha321"
  }
];

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
const validateForm = (data, showPassword) => {
  const errors = {};
  if (!data.Name?.trim()) errors.Name = "Name is required";
  if (!data.Email?.trim()) {
    errors.Email = "Email is required";
  } else if (!validateEmail(data.Email)) {
    errors.Email = "Invalid email format";
  }
  if (showPassword) {
    if (!data.Password?.trim()) errors.Password = "Password is required";
    if (data.Password && data.Password.length < 6) errors.Password = "Password must be at least 6 characters";
  }
  return errors;
};

export default function ManageAdmin() {
  const [rows, setRows] = useState(initialRows);
  const [sideFormMode, setSideFormMode] = useState(null); // 'add' or 'edit'
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    Password: ""
  });
  const [formErrors, setFormErrors] = useState({});

  const resetForm = () => {
    setFormData({ Name: "", Email: "", Password: "" });
    setFormErrors({});
    setSideFormMode(null);
    setEditIndex(null);
  };

  // Add/Edit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm(formData, sideFormMode === "add"); // Only require password for ADD
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    if (sideFormMode === 'edit') {
      handleUpdate();
    } else {
      handleAdd();
    }
  };

  const handleEdit = (row, idx) => {
    setEditIndex(idx);
    setFormData({...row, Password: ""}); // Don't show password in edit form
    setFormErrors({});
    setSideFormMode('edit');
  };
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };
  const handleUpdate = () => {
    const updatedRows = [...rows];
    updatedRows[editIndex] = { ...rows[editIndex], Name: formData.Name, Email: formData.Email };
    setRows(updatedRows);
    resetForm();
  };
  const handleAdd = () => {
    setRows((prevRows) => [...prevRows, formData]);
    resetForm();
  };
  const handleDelete = (idx) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    setRows((prevRows) => prevRows.filter((_, i) => i !== idx));
    if (editIndex === idx) resetForm();
  };
  const openAddForm = () => {
    resetForm();
    setSideFormMode('add');
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100vh' }}>
      <div style={{ flex: sideFormMode ? '2' : '1', transition: 'flex 0.3s ease' }}>
        <DashboardSectionHeader>Manage Admin</DashboardSectionHeader>
        <div className="section-desc">
          Admins can view, add, update, and delete system administrators.
        </div>
        <div style={{ display: "flex", justifyContent: "right", margin: "20px 0" }}>
          <button
            className="add-supervisor-btn"
            onClick={openAddForm}
            disabled={sideFormMode === 'add'}
          >
            + Add Admin
          </button>
        </div>
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <AppTable
            headers={headers}
            rows={rows.map(({ Name, Email }) => ({ Name, Email }))}
            renderActions={(row, i) => (
              <>
                <button
                  className="table-action-btn"
                  onClick={() => handleEdit(rows[i], i)}
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
        <div style={{
          flex: '1',
          minWidth: '400px',
          maxWidth: '500px',
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '10px',
            borderBottom: '2px solid #e9ecef'
          }}>
            <h3 style={{ margin: 0, color: '#01337a' }}>
              {sideFormMode === 'edit' ? 'Edit Admin' : 'Add New Admin'}
            </h3>
            <button
              onClick={resetForm}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <FormInput
              label="Name"
              name="Name"
              value={formData.Name}
              onChange={handleFormChange}
              type="text"
              required
              error={formErrors.Name}
              placeholder="Enter admin name"
            />
            <FormInput
              label="Email"
              name="Email"
              value={formData.Email}
              onChange={handleFormChange}
              type="email"
              required
              error={formErrors.Email}
              placeholder="Enter admin email"
            />
            {sideFormMode === "add" && (
              <FormInput
                label="Password"
                name="Password"
                value={formData.Password}
                onChange={handleFormChange}
                type="password"
                required
                error={formErrors.Password}
                placeholder="Enter admin password"
              />
            )}
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
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