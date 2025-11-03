import React, { useState, useEffect } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import adminSupervisorApi from "../Api/AdminApi/AdminApis.jsx";
import "../Admin/Modal&Button.css";
import { toastService } from '../ToastService/ToastService.jsx';
import {Confirm} from "../ConfirmService/ConfirmService.jsx";

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

const headers = ["Name", "Email", "Department"];

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
  if (!data.Department?.trim()) errors.Department = "Department is required";
  if (showPassword) {
    if (!data.Password?.trim()) errors.Password = "Password is required";
    if (data.Password && data.Password.length < 6) errors.Password = "Password must be at least 6 characters";
  }
  return errors;
};

export default function ManageCoordinators() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sideFormMode, setSideFormMode] = useState(null); // 'add' or 'edit'
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    Department: "",
    Password: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch coordinators from backend
  useEffect(() => {
    const fetchCoordinators = async () => {
      setLoading(true);
      const res = await adminSupervisorApi.getCoordinators();
      if (res.success) {
        const coordinators = res.data.map(coord => ({
          ID: coord._id,
          Name: coord.name,
          Email: coord.email,
          Department: coord.department || ""
        }));
        setRows(coordinators);
      } else {
        setRows([]);
        toastService.error("Failed to fetch coordinators. Please try again.");
      }
      setLoading(false);
    };
    fetchCoordinators();
  }, []);

  const resetForm = () => {
    setFormData({ Name: "", Email: "", Department: "", Password: "" });
    setFormErrors({});
    setSideFormMode(null);
    setEditIndex(null);
  };

  // Add/Edit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData, sideFormMode === 'add');
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      if (sideFormMode === 'edit') {
        await handleUpdate();
      } else {
        await handleAdd();
      }
    } catch (err) {
      toastService.error('An error occurred. Please try again.');
    }
  };

  const handleEdit = (row, idx) => {
    setEditIndex(idx);
    setFormData({ Name: row.Name, Email: row.Email, Department: row.Department, Password: "" });
    setFormErrors({});
    setSideFormMode('edit');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    const id = rows[editIndex].ID;
    const payload = {
      name: formData.Name,
      email: formData.Email,
      department: formData.Department,
      ...(formData.Password ? { password: formData.Password } : {})
    };
    const res = await adminSupervisorApi.updateCoordinator(id, payload);
    setLoading(false);
    if (res.success) {
      toastService.success('Coordinator updated successfully!');
      resetForm();
      // refetch list
      const refreshed = await adminSupervisorApi.getCoordinators();
      setRows(refreshed.data.map(coord => ({
        ID: coord._id, Name: coord.name, Email: coord.email, Department: coord.department || ""
      })));
    } else {
      toastService.error("Update failed: " + (res.error || res.data?.message || 'Unknown error'));
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    const payload = {
      name: formData.Name,
      email: formData.Email,
      password: formData.Password,
      department: formData.Department
    };
    const res = await adminSupervisorApi.createCoordinator(payload);
    setLoading(false);
    if (res.success) {
      toastService.success('Coordinator added successfully!');
      resetForm();
      const refreshed = await adminSupervisorApi.getCoordinators();
      setRows(refreshed.data.map(coord => ({
        ID: coord._id, Name: coord.name, Email: coord.email, Department: coord.department || ""
      })));
    } else {
      toastService.error("Add failed: " + (res.error || res.data?.message || 'Unknown error'));
    }
  };

  const handleDelete = async (idx) => {
    const confirmed = await Confirm("Are you sure you want to delete this coordinator??");
    if (!confirmed) {
      return;
    }
    setLoading(true);
    const id = rows[idx].ID;
    const res = await adminSupervisorApi.deleteCoordinator(id);
    setLoading(false);
    if (res.success) {
      toastService.success('Coordinator deleted successfully!');
      resetForm();
      // refetch list
      const refreshed = await adminSupervisorApi.getCoordinators();
      setRows(refreshed.data.map(coord => ({
        ID: coord._id, Name: coord.name, Email: coord.email, Department: coord.department || ""
      })));
    } else {
      toastService.error("Delete failed: " + (res.error || res.data?.message || 'Unknown error'));
    }
  };

  // UPDATED: Remove Coordinator handler (converts to supervisor instead of deleting)
  const handleRemove = async (idx) => {
    const confirmed = await Confirm("Are you sure you want to remove this coordinator? This will convert them to a supervisor role.");
    if (!confirmed) {
      return;
    }
    setLoading(true);
    const id = rows[idx].ID;
    // Using the new removeCoordinator API instead of delete
    const res = await adminSupervisorApi.removeCoordinator(id);
    setLoading(false);
    if (res.success) {
      toastService.success('Coordinator removed successfully! Converted to supervisor.');
      resetForm();
      // refetch coordinators list
      const refreshed = await adminSupervisorApi.getCoordinators();
      setRows(refreshed.data.map(coord => ({
        ID: coord._id, Name: coord.name, Email: coord.email, Department: coord.department || ""
      })));
    } else {
      toastService.error("Remove failed: " + (res.error || res.data?.message || 'Unknown error'));
    }
  };

  const openAddForm = () => {
    resetForm();
    setSideFormMode('add');
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100vh' }}>
      <div style={{ flex: sideFormMode ? '2' : '1', transition: 'flex 0.3s ease' }}>
        <DashboardSectionHeader description={" Admins can view the list of coordinators, add new coordinators, update existing coordinator details, and delete coordinators from the system."}>Manage Project Coordinators</DashboardSectionHeader>
                  
        <div style={{ display: "flex", justifyContent: "right", margin: "20px 0" }}>
          <button
            className="add-supervisor-btn"
            onClick={openAddForm}
            disabled={sideFormMode === 'add'}
          >
            + Add Coordinator
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 20 }}>Loading coordinators...</div>
        ) : (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <AppTable
              headers={headers}
              rows={rows.map(({ Name, Email, Department }) => ({ Name, Email, Department }))}
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
                    style={{ background: "#f43f5e", marginLeft: 8 }}
                    onClick={() => handleDelete(i)}
                    disabled={sideFormMode}
                  >
                    Delete
                  </button>

                  {/* UPDATED: Remove Coordinator button with new functionality */}
                  <button
                    className="table-action-btn"
                    style={{ background: "rgb(1 51 122)", color: "#fff", marginLeft: 8 }}
                    onClick={() => handleRemove(i)}
                    disabled={sideFormMode}
                    title="Remove Coordinator (Convert to Supervisor)"
                  >
                    Remove Coordinator
                  </button>
                </>
              )}
            />
          </div>
        )}
      </div>
      {sideFormMode && (
        <div style={{
          flex: '1',
          minWidth: '340px',
          maxWidth: '400px',
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '2px solid #e9ecef'
          }}>
            <h3 style={{ margin: 0, color: '#01337a', fontSize: '1.07rem' }}>
              {sideFormMode === 'edit' ? 'Edit Coordinator' : 'Add New Coordinator'}
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
          <form onSubmit={handleSubmit}>
            <FormInput
              label="Name"
              name="Name"
              value={formData.Name}
              onChange={handleFormChange}
              type="text"
              required
              error={formErrors.Name}
              placeholder="Enter coordinator name"
            />
            <FormInput
              label="Email"
              name="Email"
              value={formData.Email}
              onChange={handleFormChange}
              type="email"
              required
              error={formErrors.Email}
              placeholder="Enter coordinator email"
            />
            <FormInput
              label="Department"
              name="Department"
              value={formData.Department}
              onChange={handleFormChange}
              type="text"
              required
              error={formErrors.Department}
              placeholder="Enter department"
            />
            {sideFormMode === 'add' && (
              <FormInput
                label="Password"
                name="Password"
                value={formData.Password}
                onChange={handleFormChange}
                type="password"
                required
                error={formErrors.Password}
                placeholder="Enter coordinator password"
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