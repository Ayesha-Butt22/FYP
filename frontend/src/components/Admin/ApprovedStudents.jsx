import React, { useState, useEffect } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import adminSupervisorApi from "../Api/AdminApi/AdminApis.jsx";
import "../Admin/Modal&Button.css";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import { toastService } from '../ToastService/ToastService.jsx';

const headers = ["Name", "SAP ID", "Email", "Department", "Batch", "Status", "Actions"];

function formatBatchAsRange(rawBatch) {
  if (rawBatch == null) return "";
  const str = String(rawBatch).trim();
  const yearMatch = str.match(/(20\d{2})/);
  if (!yearMatch) return str;
  const startYear = Number(yearMatch[1]);
  if (isNaN(startYear)) return str;
  const endYear = startYear + 4;
  return `${startYear}-${endYear}`;
}

// Status Badge Component
function StatusBadge({ approved }) {
  return (
    <span
      style={{
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '0.875rem',
        fontWeight: '600',
        backgroundColor: approved ? '#dcfce7' : '#fee2e2',
        color: approved ? '#166534' : '#991b1b'
      }}
    >
      {approved ? 'Approved' : 'Pending'}
    </span>
  );
}

export default function ApprovedStudents() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchFilter, setBatchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await adminSupervisorApi.getStudents();
      if (res.success && Array.isArray(res.data)) {
        const students = res.data.map((student) => {
          const rawBatch =
            student.batch ??
            student.batchYear ??
            student.batch_year ??
            student.year ??
            student.cohort ??
            student.batch_code ??
            "";
          return {
            ID: student._id,
            Name: student.name,
            "SAP ID": student.studentId,
            Email: student.email,
            Department: student.department,
            RawBatch: rawBatch,
            Batch: formatBatchAsRange(rawBatch),
            Approved: student.IsApproved,
          };
        });
        setRows(students);
      } else {
        setRows([]);
        toastService.error("Failed to fetch students");
      }
    } catch (error) {
      toastService.error("Error fetching students");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const uniqueBatches = Array.from(
    new Set(rows.map((r) => (r.Batch ? String(r.Batch) : "")).filter(Boolean))
  );

  // Filter students based on batch and status
  const displayedRows = rows.filter((r) => {
    const batchMatch = batchFilter === "All" || String(r.Batch) === String(batchFilter);
    const statusMatch = statusFilter === "All" || 
      (statusFilter === "Approved" && r.Approved) ||
      (statusFilter === "Pending" && !r.Approved);
    return batchMatch && statusMatch;
  });

  const handleToggleApproval = async (idx, currentStatus) => {
    const action = currentStatus ? "unapprove" : "approve";
    const confirmed = await Confirm(
      `Are you sure you want to ${action} this student?`
    );
    
    if (!confirmed) return;

    try {
      const studentId = displayedRows[idx].ID;
      const res = await adminSupervisorApi.toggleStudentApproval(studentId);
      
      if (res.success) {
        toastService.success(res.data.message);
        
        // Update the local state
        setRows((prev) =>
          prev.map((r) => 
            r.ID === studentId ? { ...r, Approved: !currentStatus } : r
          )
        );
      } else {
        toastService.error("Operation failed: " + (res.error || res.data?.message));
      }
    } catch (error) {
      toastService.error("Network error: " + error.message);
    }
  };

  const approvedCount = rows.filter(r => r.Approved).length;
  const pendingCount = rows.filter(r => !r.Approved).length;

  return (
    <>
      <DashboardSectionHeader 
        description={"Admins can view registered students, approve them for portal access, or update their details."}
      >
        Manage Students
      </DashboardSectionHeader>

      {/* Filters + Summary */}
      <div style={{ 
        display: "flex", 
        gap: 12, 
        alignItems: "center", 
        margin: "12px 0 18px",
        flexWrap: 'wrap' 
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ fontWeight: 700, color: "#01337a" }}>Batch:</label>
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d1d9e6",
              background: "#fff",
              fontWeight: 700,
              minWidth: 160,
            }}
          >
            <option value="All">All batches</option>
            {uniqueBatches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ fontWeight: 700, color: "#01337a" }}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d1d9e6",
              background: "#fff",
              fontWeight: 700,
              minWidth: 160,
            }}
          >
            <option value="All">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div style={{ 
          marginLeft: "auto", 
          color: "#374151", 
          fontWeight: 700,
          display: 'flex',
          gap: '16px'
        }}>
          <span>Total: {rows.length}</span>
          <span style={{color: 'green'}}>Approved: {approvedCount}</span>
          <span style={{color: 'red'}}>Pending: {pendingCount}</span>
          <span>Showing: {displayedRows.length}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 20 }}>Loading students...</div>
      ) : (
        <AppTable
          headers={headers}
          rows={displayedRows.map((row) => ({
            ...row,
            Batch: row.Batch || "—",
            Status: <StatusBadge approved={row.Approved} />,
            Actions: (
              <button
                className="table-action-btn"
                style={{ 
                  background: row.Approved ? "#f43f5e" : "#10b981",
                  color: "white"
                }}
                onClick={() => handleToggleApproval(
                  displayedRows.findIndex(r => r.ID === row.ID), 
                  row.Approved
                )}
              >
                {row.Approved ? "Unapprove" : "Approve"}
              </button>
            ),
          }))}
        />
      )}
    </>
  );
}