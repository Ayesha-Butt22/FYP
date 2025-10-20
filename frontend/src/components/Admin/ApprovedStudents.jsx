import React, { useState, useEffect } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import adminSupervisorApi from "../Api/AdminApi/AdminApis.jsx";
import "../Admin/Modal&Button.css";
import {Confirm} from "../ConfirmService/ConfirmService.jsx";

const headers = ["Name", "SAP ID", "Email", "Department", "Approved"];

export default function ApprovedStudents() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      const res = await adminSupervisorApi.getStudents();
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data.map(student => ({
          ID: student._id,
          Name: student.name,
          "SAP ID": student.studentId,
          Email: student.email,
          Department: student.department,
          Approved: student.IsApproved
        })));
      } else {
        setRows([]);
      }
    };
    fetchStudents();
  }, []);

  const handleApprove = async (idx) => {
    const confirmed = await Confirm("Are you sure you want to approve this student?");
    if (!confirmed) {
      return;
    }
    const studentId = rows[idx].ID;
    const res = await adminSupervisorApi.approveStudent(studentId);
    if (res.success && res.data.student && res.data.student.IsApproved) {
      const updatedRows = [...rows];
      updatedRows[idx].Approved = true;
      setRows(updatedRows);
    }
  };

  return (
    <>
      <DashboardSectionHeader description={"Admins can view registered students, approve them for portal access, or update their details."}>Approved Students</DashboardSectionHeader>
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