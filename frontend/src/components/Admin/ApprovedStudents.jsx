import React, { useState, useEffect } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import adminSupervisorApi from "../Api/AdminApi/AdminApis.jsx";
import "../Admin/Modal&Button.css";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";

const headers = ["Name", "SAP ID", "Email", "Department", "Batch", "Approved"];

function formatBatchAsRange(rawBatch) {
  // If batch is a year (e.g. "2022" or 2022) convert to "2022-2026"
  if (rawBatch == null) return "";
  const str = String(rawBatch).trim();
  // accept formats like "2022", "2022/23", "2022-23"
  const yearMatch = str.match(/(20\d{2})/);
  if (!yearMatch) return str; // fallback to original string
  const startYear = Number(yearMatch[1]);
  if (isNaN(startYear)) return str;
  const endYear = startYear + 4;
  return `${startYear}-${endYear}`;
}

export default function ApprovedStudents() {
  const [rows, setRows] = useState([]);
  const [batchFilter, setBatchFilter] = useState("All");

  useEffect(() => {
    const fetchStudents = async () => {
      const res = await adminSupervisorApi.getStudents();
      if (res.success && Array.isArray(res.data)) {
        setRows(
          res.data.map((student) => {
            // pick batch from likely fields
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
          })
        );
      } else {
        setRows([]);
      }
    };
    fetchStudents();
  }, []);

  const uniqueBatches = Array.from(
    new Set(rows.map((r) => (r.Batch ? String(r.Batch) : "")).filter(Boolean))
  );

  // displayed rows after applying batch filter
  const displayedRows = rows.filter(
    (r) => batchFilter === "All" || String(r.Batch) === String(batchFilter)
  );

  const handleApprove = async (idx) => {
    const confirmed = await Confirm("Are you sure you want to approve this student?");
    if (!confirmed) {
      return;
    }
    const studentId = displayedRows[idx].ID;
    const res = await adminSupervisorApi.approveStudent(studentId);
    if (res.success && res.data.student && res.data.student.IsApproved) {
      // update the main rows state
      setRows((prev) =>
        prev.map((r) => (r.ID === studentId ? { ...r, Approved: true } : r))
      );
    }
  };

  return (
    <>
      <DashboardSectionHeader description={"Admins can view registered students, approve them for portal access, or update their details."}>
        Approved Students
      </DashboardSectionHeader>

      {/* Batch filter + summary */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0 18px" }}>
        <label style={{ fontWeight: 700, color: "#01337a" }}>Filter by Batch:</label>
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

        <div style={{ marginLeft: "auto", color: "#374151", fontWeight: 700 }}>
          Showing {displayedRows.length} of {rows.length} students
        </div>
      </div>

      <AppTable
        headers={headers}
        rows={displayedRows.map((row, i) => ({
          ...row,
          Batch: row.Batch || "—",
          Approved: row.Approved ? (
            <span style={{ color: "green", fontWeight: "bold" }}>Yes</span>
          ) : (
            <button
              className="table-action-btn"
              style={{ background: "#10b981" }}
              onClick={() => handleApprove(i)}
            >
              Approve
            </button>
          ),
        }))}
      />
    </>
  );
}