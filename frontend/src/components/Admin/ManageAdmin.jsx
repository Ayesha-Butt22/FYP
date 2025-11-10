import React, { useEffect, useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import AppTable from "./AppTable.jsx";
import adminSupervisorApi from "../Api/AdminApi/AdminApis.jsx";
import "../Admin/Modal&Button.css";
import { toastService } from '../ToastService/ToastService.jsx';
import { Confirm } from "../ConfirmService/ConfirmService.jsx";


function FormInput({ label, error, ...props }) {
  return (
    <div className="form-group">
      <label>{label} {props.required && <span style={{ color: '#f43f5e' }}>*</span>}</label>
      <input {...props} style={{ borderColor: error ? '#f43f5e' : '#dbdbec' }} />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

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
  if (!data.Gender) errors.Gender = "Gender is required";
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

// Function to convert gender for display
const getDisplayGender = (gender) => {
  if (!gender) return "";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

// Function to convert gender for backend
const getBackendGender = (gender) => {
  if (!gender) return "";
  return gender.toLowerCase();
};

export default function ManageAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sideFormMode, setSideFormMode] = useState(null);
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
  const [processing, setProcessing] = useState(false);

  
  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      try {
        const res = await adminSupervisorApi.getAdmins();
        console.log("Fetch Admins Response:", res);
        
        if (res.success && res.data) {
          const admins = res.data.map(adm => ({
            ID: adm.studentId || adm._id,
            Name: adm.name,
            Email: adm.email,
            Gender: getDisplayGender(adm.gender), 
            ContactNumber: adm.contactNumber,
            Password: "******",
            _id: adm._id,
            originalGender: adm.gender 
          }));
          setRows(admins);
        } else {
          setRows([]);
          const errorMsg = res.data?.error || res.data?.message || "Failed to fetch admins";
          toastService.error(errorMsg);
        }
      } catch (err) {
        console.error("fetchAdmins error:", err);
        setRows([]);
        toastService.error("Network error: Failed to fetch admins");
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
      toastService.error('An unexpected error occurred. Please try again.');
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
      ContactNumber: row.ContactNumber || ""
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

  const getErrorMessage = (res) => {
    if (res.data?.error) return res.data.error;
    if (res.data?.message) return res.data.message;
    if (res.error) return res.error;
    if (res.data?.errors) {
      return res.data.errors.map(err => err.msg).join(', ');
    }
    return "Unknown error occurred";
  };

  const handleUpdate = async () => {
    setProcessing(true);
    try {
      const actualId = rows[editIndex]._id;
      const payload = {
        name: formData.Name,
        email: formData.Email,
        gender: getBackendGender(formData.Gender), 
        contactNumber: formData.ContactNumber
        
      };

      console.log("Update Payload:", payload);
      const res = await adminSupervisorApi.updateAdmin(actualId, payload);
      console.log("Update Response:", res);
      
      if (res.success) {
        toastService.success('Admin updated successfully!');
        
        
        const adminsRes = await adminSupervisorApi.getAdmins();
        if (adminsRes.success) {
          const admins = adminsRes.data.map(adm => ({
            ID: adm.studentId || adm._id,
            Name: adm.name,
            Email: adm.email,
            Gender: getDisplayGender(adm.gender),
            ContactNumber: adm.contactNumber,
            Password: "******",
            _id: adm._id
          }));
          setRows(admins);
        }
        
        resetForm();
      } else {
        const errorMsg = getErrorMessage(res);
        toastService.error(`Update failed: ${errorMsg}`);
      }
    } catch (err) {
      console.error("handleUpdate error:", err);
      toastService.error(`Update failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleAdd = async () => {
    setProcessing(true);
    try {
      const payload = {
        name: formData.Name,
        email: formData.Email,
        gender: getBackendGender(formData.Gender), 
        contactNumber: formData.ContactNumber,
        password: formData.Password
      };

      console.log("Add Payload:", payload);
      const res = await adminSupervisorApi.createAdmin(payload);
      console.log("Add Response:", res);
      
      if (res.success) {
        toastService.success('Admin added successfully!');
        
     
        const adminsRes = await adminSupervisorApi.getAdmins();
        if (adminsRes.success) {
          const admins = adminsRes.data.map(adm => ({
            ID: adm.studentId || adm._id,
            Name: adm.name,
            Email: adm.email,
            Gender: getDisplayGender(adm.gender), 
            ContactNumber: adm.contactNumber,
            Password: "******",
            _id: adm._id
          }));
          setRows(admins);
        }
        
        resetForm();
      } else {
        const errorMsg = getErrorMessage(res);
        toastService.error(`Add failed: ${errorMsg}`);
      }
    } catch (err) {
      console.error("handleAdd error:", err);
      toastService.error(`Add failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (idx) => {
    const confirmed = await Confirm("Are you sure you want to delete this admin?");
    if (!confirmed) return;

    setProcessing(true);
    try {
      const actualId = rows[idx]._id;

      const res = await adminSupervisorApi.deleteAdmin(actualId);
      console.log("Delete Response:", res);
      
      if (res.success) {
        toastService.success('Admin deleted successfully!');
        
        const adminsRes = await adminSupervisorApi.getAdmins();
        if (adminsRes.success) {
          const admins = adminsRes.data.map(adm => ({
            ID: adm.studentId || adm._id,
            Name: adm.name,
            Email: adm.email,
            Gender: getDisplayGender(adm.gender),
            ContactNumber: adm.contactNumber,
            Password: "******",
            _id: adm._id
          }));
          setRows(admins);
        }
        
        resetForm();
      } else {
        const errorMsg = getErrorMessage(res);
        toastService.error(`Delete failed: ${errorMsg}`);
      }
    } catch (err) {
      console.error("handleDelete error:", err);
      toastService.error(`Delete failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const openAddForm = () => {
    setFormData({ ID: "Auto-generated", Name: "", Email: "", Password: "", Gender: "", ContactNumber: "" });
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
            className="add-admin-btn"
            onClick={openAddForm}
            disabled={sideFormMode === "add" || processing}
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
                    disabled={sideFormMode || processing}
                  >
                    Edit
                  </button>
                  <button
                    className="table-action-btn"
                    style={{ background: "#f43f5e" }}
                    onClick={() => handleDelete(i)}
                    disabled={sideFormMode || processing}
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
              disabled={processing}
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
              label="Admin id"
              name="ID"
              value={formData.ID}
              onChange={handleFormChange}
              type="text"
              required
              placeholder="Auto-generated"
              error={formErrors.ID}
              readOnly={true}
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
              disabled={processing}
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
              disabled={processing}
            />

            <div className="form-group">
              <label>Gender {<span style={{ color: '#f43f5e' }}>*</span>}</label>
              <select
                name="Gender"
                value={formData.Gender}
                onChange={handleFormChange}
                required
                disabled={processing}
                style={{ 
                  padding: '8px', 
                  borderRadius: '6px', 
                  border: `1px solid ${formErrors.Gender ? '#f43f5e' : '#dbdbec'}`, 
                  width: '100%' 
                }}
              >
                <option value="">-- Select gender --</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
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
              disabled={processing}
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
                disabled={processing}
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
                disabled={processing}
              >
                {processing ? 'Processing...' : (sideFormMode === 'edit' ? 'Update' : 'Save')}
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
                disabled={processing}
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