import React, { useEffect, useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import AppTable from "./AppTable.jsx";
import adminSupervisorApi from "../Api/AdminApi/AdminApis.jsx";
import "../Admin/Modal&Button.css";
import { toastService } from '../ToastService/ToastService.jsx';
import { Confirm } from "../ConfirmService/ConfirmService.jsx";

// --- Reusable input for form fields ---
function FormInput({ label, error, ...props }) {
  return (
    <div className="form-group">
      <label>{label} {props.required && <span style={{ color: '#f43f5e' }}>*</span>}</label>
      <input {...props} style={{ borderColor: error ? '#f43f5e' : '#dbdbec' }} />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

// Updated headers to include Admin id, Name, Email, Gender, Contact number
const headers = ["Admin id", "Name", "Email", "Gender", "Contact number"];

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
  // optional: basic contact number check (not strict)
  if (data.ContactNumber && data.ContactNumber.length < 7) {
    errors.ContactNumber = "Contact number seems too short";
  }
  if (showPassword) {
    if (!data.Password?.trim()) errors.Password = "Password is required";
    if (data.Password && data.Password.length < 6)
      errors.Password = "Password must be at least 6 characters";
  }
  return errors;
};

/**
 * TEMPORARY: Use dummy admins array and short-circuit update/delete/add calls
 * Do not change API implementation files. This component will simulate responses
 * locally and not actually call the backend for list/add/update/delete operations.
 *
 * To re-enable real API behavior, remove the short-circuit returns in handleAdd/handleUpdate/handleDelete
 * and allow adminSupervisorApi.* to run as before.
 */
const DUMMY_ADMINS = [
  {
    _id: "adm-001",
    name: "Ayesha Butt",
    email: "ayesha.butt@example.com",
    gender: "Female",
    contactNumber: "+92-300-1112223",
    password: "secret1"
  },
  {
    _id: "adm-002",
    name: "Madiha Sumbal",
    email: "madiha.sumbal@example.com",
    gender: "Female",
    contactNumber: "+92-300-4445556",
    password: "secret2"
  },
  {
    _id: "adm-003",
    name: "Zain Ali",
    email: "zain.ali@example.com",
    gender: "Male",
    contactNumber: "+92-300-7778889",
    password: "secret3"
  }
];

export default function ManageAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sideFormMode, setSideFormMode] = useState(null); // 'add' or 'edit'
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({
    ID: "",
    Name: "",
    Email: "",
    Password: "",
    Gender: "",
    ContactNumber: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch admins from DUMMY instead of backend while testing
  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      try {
        // Use dummy data here (simulate API response)
        const res = { success: true, data: DUMMY_ADMINS };
        if (res.success) {
          const admins = res.data.map(adm => ({
            ID: adm._id,
            Name: adm.name,
            Email: adm.email,
            Gender: adm.gender,
            ContactNumber: adm.contactNumber,
            Password: adm.password
          }));
          setRows(admins);
        } else {
          setRows([]);
          toastService.error("Failed to fetch admins. Please try again.");
        }
      } catch (err) {
        console.error("fetchAdmins error:", err);
        setRows([]);
        toastService.error("Failed to fetch admins. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  const resetForm = () => {
    setFormData({ ID: "", Name: "", Email: "", Password: "", Gender: "", ContactNumber: "" });
    setFormErrors({});
    setSideFormMode(null);
    setEditIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData, sideFormMode === "add");
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
    setFormData({
      ID: row.ID || "",
      Name: row.Name || "",
      Email: row.Email || "",
      Password: "",
      Gender: row.Gender || "",
      ContactNumber: row["Contact number"] || row.ContactNumber || ""
    });
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

  // NOTE: We short-circuit update to return a simulated successful response
  // before executing any real API call. This keeps the UI working offline.
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const id = rows[editIndex].ID;
      const payload = {
        name: formData.Name,
        email: formData.Email,
        gender: formData.Gender,
        contactNumber: formData.ContactNumber,
        ...(formData.Password ? { password: formData.Password } : {})
      };

      // Simulated API response (temporary)
      const simulatedRes = { success: true, data: { _id: id, ...payload } };
      // Return simulated response BEFORE calling real API
      if (simulatedRes.success) {
        toastService.success('Admin updated successfully! (simulated)');
        // update local rows: preserve ID and update fields
        setRows(prev => prev.map(r => r.ID === id ? {
          ...r,
          Name: payload.name,
          Email: payload.email,
          Gender: payload.gender,
          ContactNumber: payload.contactNumber
        } : r));
        resetForm();
      } else {
        toastService.error("Update failed: " + (simulatedRes.error || simulatedRes.data?.message || 'Unknown error'));
      }
      setLoading(false);
      return simulatedRes;

      // Real API (kept for reference; not executed while simulating)
      // const res = await adminSupervisorApi.updateAdmin(id, payload);
      // setLoading(false);
      // if (res.success) { ... }
    } catch (err) {
      setLoading(false);
      console.error("handleUpdate error:", err);
      toastService.error("Update failed: " + (err.message || ""));
    }
  };

  // NOTE: We short-circuit create to return a simulated successful response
  const handleAdd = async () => {
    setLoading(true);
    try {
      const payload = {
        name: formData.Name,
        email: formData.Email,
        gender: formData.Gender,
        contactNumber: formData.ContactNumber,
        password: formData.Password
      };

      // Simulated API response (temporary)
      const newId = "adm-" + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
      const simulatedRes = { success: true, data: { _id: newId, ...payload } };

      if (simulatedRes.success) {
        toastService.success('Admin added successfully! (simulated)');
        // add to local rows (keep same shape used by table)
        setRows(prev => [{
          ID: simulatedRes.data._id,
          Name: simulatedRes.data.name,
          Email: simulatedRes.data.email,
          Gender: simulatedRes.data.gender || "",
          ContactNumber: simulatedRes.data.contactNumber || "",
          Password: simulatedRes.data.password || ""
        }, ...prev]);
        resetForm();
      } else {
        toastService.error("Add failed: " + (simulatedRes.error || simulatedRes.data?.message || 'Unknown error'));
      }
      setLoading(false);
      return simulatedRes;

      // Real API (kept for reference; not executed while simulating)
      // const res = await adminSupervisorApi.createAdmin(payload);
    } catch (err) {
      setLoading(false);
      console.error("handleAdd error:", err);
      toastService.error("Add failed: " + (err.message || ""));
    }
  };

  // NOTE: We short-circuit delete to return a simulated successful response
  const handleDelete = async (idx) => {
    const confirmed = await Confirm("Are you sure you want to delete this admin?");
    if (!confirmed) return;

    setLoading(true);
    try {
      const id = rows[idx].ID;

      // Simulated API response (temporary)
      const simulatedRes = { success: true };
      // Return simulated response BEFORE calling real API
      if (simulatedRes.success) {
        toastService.success('Admin deleted successfully! (simulated)');
        setRows(prev => prev.filter((r, i) => i !== idx));
        resetForm();
      } else {
        toastService.error("Delete failed: " + (simulatedRes.error || simulatedRes.data?.message || 'Unknown error'));
      }
      setLoading(false);
      return simulatedRes;

      // Real API (kept for reference; not executed while simulating)
      // const res = await adminSupervisorApi.deleteAdmin(id);
    } catch (err) {
      setLoading(false);
      console.error("handleDelete error:", err);
      toastService.error("Delete failed: " + (err.message || ""));
    }
  };

  const openAddForm = () => {
    // generate a provisional ID for display (not required)
    const provisionalId = "adm-" + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    setFormData({ ID: provisionalId, Name: "", Email: "", Password: "", Gender: "", ContactNumber: "" });
    setFormErrors({});
    setSideFormMode('add');
    setEditIndex(null);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100vh' }}>
      <div style={{ flex: sideFormMode ? '2' : '1', transition: 'flex 0.3s ease' }}>
        
       
        <DashboardSectionHeader description="Admins can view, add, update, and delete system administrators.">
          Manage Admin
        </DashboardSectionHeader>

        <div style={{ display: "flex", justifyContent: "right", margin: "20px 0" }}>
          <button
            className="add-supervisor-btn"
            onClick={openAddForm}
            disabled={sideFormMode === 'add'}
          >
            + Add Admin
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 20 }}>Loading admins...</div>
        ) : (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <AppTable
              headers={headers}
              rows={rows.map(r => ({
                "Admin id": r.ID,
                Name: r.Name,
                Email: r.Email,
                Gender: r.Gender,
                "Contact number": r.ContactNumber
              }))}
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
        )}
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
            {/* Admin ID - readonly when editing, visible when adding */}
            <FormInput
              label="Admin id"
              name="ID"
              value={formData.ID}
              onChange={handleFormChange}
              type="text"
              required
              placeholder="Admin id"
              error={formErrors.ID}
              // allow editing only in add mode (for convenience), readonly in edit
              readOnly={sideFormMode === "edit"}
            />

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

            {/* Gender: changed to a select (scrollable dropdown) for both Add and Edit */}
            <div className="form-group">
              <label>Gender</label>
              <select
                name="Gender"
                value={formData.Gender}
                onChange={handleFormChange}
                style={{ padding: '8px', borderRadius: '6px', border: `1px solid ${formErrors.Gender ? '#f43f5e' : '#dbdbec'}`, width: '100%' }}
              >
                <option value="">-- Select gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {formErrors.Gender && <span className="error-text">{formErrors.Gender}</span>}
            </div>

            <FormInput
              label="Contact number"
              name="ContactNumber"
              value={formData.ContactNumber}
              onChange={handleFormChange}
              type="text"
              placeholder="+92-300-1234567"
              error={formErrors.ContactNumber}
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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