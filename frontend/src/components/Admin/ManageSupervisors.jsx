import React, {useState, useEffect, useCallback} from "react";
import DashboardSectionHeader from "../Admin/DashboardSectionHeader.jsx";
import AppTable from "./AppTable";
import adminSupervisorApi from "../Api/AdminApi/AdminApis.jsx";
import "../Admin/Modal&Button.css";
import { toastService } from '../ToastService/ToastService.jsx';
import {DropdownSingleSelect , DropdownMultiSelect} from "./DropDowns.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import UploadExcelModal from "../UploadExcelModal";

const ALL_SPECIALITIES = [
  "AI", "ML", "Web", "Cloud", "Data Science", "Networks", "Security", "IoT", "Embedded", "Software Engineering"
];

const headers = [
  "Name",
  "Email",
  "Department",
  "Speciality",
  "Designation",
  "Booked",
  "Status"
];

const ALL_DESIGNATIONS = [
  "Dean",
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lecturer",
  "Sr Lecturer",
  "Junior Lecturer",
  "Research Associate",
  "Research Assistant",
  "Teaching Fellow"
];

/* Default slots by designation (normalized keys).
   Matches the table you provided:
   Dean:0, Professor:1, Associate Professor:2, Assistant Professor:3,
   Lecturer/Sr Lecturer:3, Junior Lecturer:2, Research Associate/Assistant:1, Teaching Fellow:1
*/
const DESIGNATION_SLOTS = {
  "dean": 0,
  "professor": 1,
  "associate professor": 2,
  "associateprofessor": 2,
  "assistant professor": 3,
  "assistantprofessor": 3,
  "lecturer": 3,
  "sr lecturer": 3,
  "sr.lecturer": 3,
  "srlecturer": 3,
  "lecturer/sr lecturer": 3,
  "junior lecturer": 2,
  "juniorlecturer": 2,
  "research associate": 1,
  "researchassociate": 1,
  "research assistant": 1,
  "researchassistant": 1,
  "teaching fellow": 1,
  "teachingfellow": 1,
};

function normalizeDesignation(str = "") {
  return String(str).toLowerCase().replace(/[\.\s]+/g, " ").trim();
}

function getDefaultSlotsForDesignation(designation) {
  if (!designation) return 0;
  const norm = normalizeDesignation(designation);
  // try direct match
  if (DESIGNATION_SLOTS.hasOwnProperty(norm)) return DESIGNATION_SLOTS[norm];
  // try removing spaces
  const compact = norm.replace(/\s+/g, "");
  if (DESIGNATION_SLOTS.hasOwnProperty(compact)) return DESIGNATION_SLOTS[compact];
  // not found - fallback 0
  return 0;
}

function StatusBadge({ text, color }) {
  const colorMap = {
    green: { background: '#dcfce7', text: '#166534' }, // Green
    red: { background: '#fee2e2', text: '#991b1b' },   // Red
    yellow: { background: '#fef9c3', text: '#854d0e' }, // Yellow
    gray: { background: '#f1f5f9', text: '#334155' }    // Gray/Default
  };

  const style = {
    backgroundColor: colorMap[color]?.background || colorMap.gray.background,
    color: colorMap[color]?.text || colorMap.gray.text,
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '0.875rem',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize'
  };

  return <span style={style}>{text}</span>;
}

const getSupervisorStatus = (available, booked) => {
  const avail = Number(available) || 0;
  const book = Number(booked) || 0;

  if (book === 0) {
    return <StatusBadge text="NoLoad" color="green" />;
  }
  if (book === avail) {
    return <StatusBadge text="Full" color="red" />;
  }
  if (avail - book > 0) {
    return <StatusBadge text="Average" color="yellow" />;
  }

  if (book > avail) {
    return <StatusBadge text="Overbooked" color="red" />;
  }

  return <StatusBadge text="N/A" color="gray" />;
};


const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
const validateForm = (data, isEdit = false) => {
  const errors = {};

  if (!data.Name?.trim()) errors.Name = "Name is required";
  if (!data.Email?.trim()) {
    errors.Email = "Email is required";
  } else if (!validateEmail(data.Email)) {
    errors.Email = "Invalid email format";
  }
  if (!data.Department?.trim()) errors.Department = "Department is required";
  if (!data.Password?.trim() && !isEdit) errors.Password = "Password is required";
  if (data.Password && data.Password.length < 6) errors.Password = "Password must be at least 6 characters";
  if (!data.Designation?.trim()) errors.Designation = "Designation is required"; // <-- ADD THIS

  const availableSlots = Number(data["Available_Slots"] || data["Available Slots"]);
  const bookedSlots = Number(data["Booked_Slots"] || data["Booked Slots"]);

  if (isNaN(availableSlots) || availableSlots < 0) {
    errors.Available_Slots = "Available slots must be a non-negative number";
  }
  if (isNaN(bookedSlots) || bookedSlots < 0) {
    errors.Booked_Slots = "Booked slots must be a non-negative number";
  }
  if (!isNaN(availableSlots) && !isNaN(bookedSlots) && bookedSlots > availableSlots) {
    errors.Booked_Slots = "Booked slots cannot exceed available slots";
  }

  return errors;
};
function splitSpeciality(str) {
  if (!str) return [];
  return str.split(",").map(s => s.trim()).filter(Boolean);
}
function joinSpeciality(arr) {
  return arr.join(", ");
}
function FormInput({ label, error, ...props }) {
  return (
      <div className="form-group">
        <label>{label} {props.required && <span style={{color: '#f43f5e'}}>*</span>}</label>
        <input {...props} style={{ borderColor: error ? '#f43f5e' : '#dbdbec' }} />
        {error && <span className="error-text">{error}</span>}
      </div>
  );
}
export default function ManageSupervisors() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sideFormMode, setSideFormMode] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    Department: "",
    Designation: "",
    Available_Slots: 0,
    Booked_Slots: 0,
    Password: ""
  });
  const [formSpeciality, setFormSpeciality] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const resetForm = () => {
    setFormData({
      Name: "",
      Email: "",
      Department: "",
      Designation: "",
      Available_Slots: 0,
      Booked_Slots: 0,
      Password: ""
    });
    setFormSpeciality([]);
    setFormErrors({});
    setSideFormMode(null);
    setEditIndex(null);
  };

  const fetchSupervisors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminSupervisorApi.getSupervisors();
      if (res.success) {
        const supervisors = res.data.map(sup => ({
          ID: sup._id,
          Name: sup.name,
          Email: sup.email,
          Department: sup.department || "",
          Speciality: sup.specialization || "",
          "Available Slots": sup.availableSlots || 0,
          Designation: (sup.designation || "N/A").toUpperCase(),
          "Booked Slots": sup.bookedSlots || 0,
          "Booked": sup.bookedSlots || 0,
          Status: getSupervisorStatus(sup.availableSlots, sup.bookedSlots)
        }));
        setRows(supervisors);
      } else {
        toastService.error("Failed to fetch supervisors. Please try again.");
        setRows([]);
      }
    } catch (error) {
      toastService.error("Error fetching supervisors. Please check your connection.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupervisors();
  }, [fetchSupervisors]);


  const handleEdit = (row, idx) => {
    setEditIndex(idx);
    // if row designation exists, keep it and ensure available slots default if missing
    const currentDesignation = row.Designation || "";
    const defaultSlots = getDefaultSlotsForDesignation(currentDesignation);
    setFormData({
      Name: row.Name,
      Email: row.Email,
      Department: row.Department,
      Designation: row.Designation,
      Available_Slots: (typeof row["Available Slots"] !== "undefined" ? row["Available Slots"] : defaultSlots),
      Booked_Slots: row["Booked Slots"],
      Password: ""
    });
    setFormSpeciality(splitSpeciality(row.Speciality));
    setFormErrors({});
    setSideFormMode('edit');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("Slots") ? Number(value) : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // New handler for designation selection that sets default available slots
  const handleDesignationChange = (val) => {
    const defaultSlots = getDefaultSlotsForDesignation(val);
    setFormData(prev => ({
      ...prev,
      Designation: val,
      Available_Slots: defaultSlots
    }));
    // clear potential designation error
    if (formErrors.Designation) setFormErrors(prev => ({ ...prev, Designation: "" }));
    if (formErrors.Available_Slots) setFormErrors(prev => ({ ...prev, Available_Slots: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData, sideFormMode === 'edit');
    if (formSpeciality.length === 0) {
      errors.Speciality = "At least one speciality must be selected";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      if (sideFormMode === 'edit') {
        await handleUpdate();
      } else {
        await handleAdd();
      }
    } catch (error) {
      toastService.error('An error occurred. Please try again.');
    }
  };
  const handleUpdate = async () => {
    setLoading(true);
    const updated = {
      ...formData,
      Speciality: joinSpeciality(formSpeciality),
      "Available Slots": formData.Available_Slots,
      "Booked Slots": formData.Booked_Slots
    };
    const id = rows[editIndex].ID;

    const payload = {
      name: updated.Name,
      email: updated.Email,
      department: updated.Department,
      designation: updated.Designation,
      specialization: updated.Speciality,
      availableSlots: updated["Available Slots"],
      bookedSlots: updated["Booked Slots"],
      role: 'supervisor',
    };
    const res = await adminSupervisorApi.updateSupervisor(id, payload);
    if (res.success) {
      const updatedRows = [...rows];
      updatedRows[editIndex] = { ...rows[editIndex], ...updated };
      setRows(updatedRows);
      resetForm();
      setLoading(false);
      await fetchSupervisors();
      toastService.success('Supervisor updated successfully!');
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
      role: "supervisor",
      department: formData.Department,
      specialization: joinSpeciality(formSpeciality),
      availableSlots: formData.Available_Slots,
      bookedSlots: formData.Booked_Slots,
    };

    const res = await adminSupervisorApi.createSupervisor(payload);
    if (res.success) {
      const newSupervisor = {
        ID: res.data.id || `SUP${rows.length + 1}`,
        Name: formData.Name,
        Email: formData.Email,
        Department: formData.Department,
        Speciality: joinSpeciality(formSpeciality),
        "Available Slots": formData.Available_Slots,
        "Booked Slots": formData.Booked_Slots
      };
      setRows((prev) => [...prev, newSupervisor]);
      resetForm();
      setLoading(false);
      await fetchSupervisors();
      toastService.success('Supervisor added successfully!');
    } else {
      toastService.error("Add failed: " + (res.error || res.data?.message || 'Unknown error'));
    }
  };
  const handleDelete = async (idx) => {

    const confirmed = await Confirm("Are you sure you want to delete this supervisor??");
    if (!confirmed) {
      return;
    }
    const id = rows[idx].ID;
    const res = await adminSupervisorApi.deleteSupervisor(id);
    if (res.success) {
      setRows((prev) => prev.filter((_, i) => i !== idx));
      if (editIndex === idx) resetForm();
      toastService.success('Supervisor deleted successfully!');
    } else {
      toastService.error("Delete failed: " + (res.error || res.data?.message || 'Unknown error'));
    }
  };


  const handleMakeCoordinator = async (idx) => {
    const confirmed = await Confirm("Are you sure you want to make this user Coordinator?");
    if (!confirmed) {
      return;
    }
    const id = rows[idx].ID;
    const res = await adminSupervisorApi.makeCoordinator(id);
    if (res.success) {
      setRows((prev) => prev.filter((_, i) => i !== idx));
      if (editIndex === idx) resetForm();
      toastService.success('Promoted to Coordinator successfully!');
    } else {
      toastService.error("Coordinator role assigning  failed: " + (res.error || res.data?.message || 'Unknown error'));
    }

  }
  const openAddForm = () => {
    resetForm();
    setSideFormMode('add');
  };
  return (
      <>
      <div style={{ display: 'flex', gap: '20px', height: '100vh' }}>
        <div style={{ flex: sideFormMode ? '2' : '1', transition: 'flex 0.3s ease' }}>
          <DashboardSectionHeader description={"Admins can view the list of supervisors, add new supervisors, update existing supervisor details, and delete supervisors from the system."}>Manage Supervisors</DashboardSectionHeader>
          

          <div style={{display: "flex", justifyContent: "right", margin: "20px 0" , gap: "20px"}}>
            <button
                className="add-supervisor-btn"
                onClick={openAddForm}
                disabled={sideFormMode === 'add'}
            >
              + Add Supervisor
            </button>

            <button
                className="add-supervisor-btn ml-4"
                onClick={() => setIsModalOpen(true)}
                disabled={sideFormMode === 'add'}
            >
              + upload Excel
            </button>
          </div>

          {loading ? (
              <div style={{textAlign: "center", padding: 20}}>Loading supervisors...</div>
          ) : (
              <div style={{display: 'flex', gap: '5px'}}>
                <AppTable
                    headers={headers}
                    rows={rows}
                    renderActions={(row, i) => (
  <>
    <button
      className="table-action-btn"
      onClick={() => handleEdit(row, i)}
      disabled={sideFormMode && editIndex === i}
    >
      {sideFormMode && editIndex === i ? 'Editing...' : 'Edit'}
    </button>

    {!sideFormMode && (
      <>
        <button
          className="table-action-btn"
          style={{ background: "#f43f5e" }}
          onClick={() => handleDelete(i)}
        >
          Delete
        </button>

        <button
          className="table-action-btn"
          style={{ background: "#013379" }}
          onClick={() => handleMakeCoordinator(i)}
        >
          Promote
        </button>
      </>
    )}
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
                  {sideFormMode === 'edit' ? 'Edit Supervisor' : 'Add New Supervisor'}
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
                    placeholder="Enter supervisor name"
                />

                <FormInput
                    label="Email"
                    name="Email"
                    value={formData.Email}
                    onChange={handleFormChange}
                    type="email"
                    required
                    error={formErrors.Email}
                    placeholder="Enter supervisor email"
                />

                <div className="form-group">
                  <label>
                    Department <span style={{color: '#f43f5e'}}>*</span>
                  </label>
                  <DropdownSingleSelect
                      value={formData.Department}
                      options={["CS", "SE", "CA"]}
                      onChange={(val) =>
                          setFormData(prev => ({...prev, Department: val}))
                      }
                      placeholder="Select Department"
                  />
                  {formErrors.Department && (
                      <span className="error-text">{formErrors.Department}</span>
                  )}
                </div>


                <div className="form-group">
                  <label>
                    Speciality <span style={{color: '#f43f5e'}}>*</span>
                  </label>
                  <DropdownMultiSelect
                      value={formSpeciality}
                      options={ALL_SPECIALITIES}
                      onChange={setFormSpeciality}
                      placeholder="Select specialities"
                  />
                  {formErrors.Speciality && <span className="error-text">{formErrors.Speciality}</span>}
                </div>

                <div className="form-group">
                  <label>
                    Designation <span style={{color: '#f43f5e'}}>*</span>
                  </label>
                  <DropdownSingleSelect
                      value={formData.Designation}
                      options={ALL_DESIGNATIONS}
                      onChange={handleDesignationChange}
                      placeholder="Select Designation"
                  />
                  {formErrors.Designation && (
                      <span className="error-text">{formErrors.Designation}</span>
                  )}
                </div>

                <FormInput
                    label="Available Slots"
                    name="Available_Slots"
                    value={formData.Available_Slots}
                    onChange={handleFormChange}
                    type="number"
                    min={0}
                    required
                    error={formErrors.Available_Slots}
                />

                <FormInput
                    label="Booked Slots"
                    name="Booked_Slots"
                    value={formData.Booked_Slots}
                    onChange={handleFormChange}
                    type="number"
                    min={0}
                    required
                    error={formErrors.Booked_Slots}
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
                        placeholder="Enter supervisor password"
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

        <UploadExcelModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
        />
      </>

  );
}