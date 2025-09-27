import React, { useState } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import "../Admin/Modal&Button.css";

const headers = ["Name", "SAP ID", "Email", "Department", "Approved"];

const initialRows = [
  {
    Name: "Ali Raza",
    "SAP ID": "48288",
    Email: "48288@students.riphah.edu.pk",
    Department: "CS",
    Approved: false
  },
  {
    Name: "Sana Fatima",
    "SAP ID": "48299",
    Email: "48299@students.riphah.edu.pk",
    Department: "SE",
    Approved: false
  }
];

export default function ApprovedStudents() {
  const [rows, setRows] = useState(initialRows);

  const handleApprove = (idx) => {
    const updatedRows = [...rows];
    updatedRows[idx].Approved = true;
    setRows(updatedRows);
    // TODO: Add backend API call here to set approved status in database
  };

  return (
    <>
      <DashboardSectionHeader>Approved Students</DashboardSectionHeader>
      <div className="section-desc">
        Admins can view registered students, approve them for portal access, or update their details.
      </div>
      <AppTable
        headers={headers}
        rows={rows.map((row, i) => ({
          ...row,
          Approved: row.Approved
            ? <span style={{ color: "green", fontWeight: "bold" }}>Yes</span>
            : <button className="table-action-btn" style={{ background: "#10b981" }} onClick={() => handleApprove(i)}>Approve</button>
        }))}
      />
    </>
  );
}