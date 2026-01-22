import React, { useEffect, useState, useRef } from "react";
import { Box } from "@mui/material";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import AppTable from "../Admin/AppTable.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import "./StudentUploads.css";
import TemplateService from "../Api/TemplateService.jsx";

/* ================= HELPERS ================= */
const calculateDueDate = (startDate, week) => {
  if (!startDate) return "—";
  const d = new Date(startDate);
  d.setDate(d.getDate() + week * 7);
  return d.toISOString().split("T")[0];
};

const getCurrentWeek = (semesterStart) => {
  if (!semesterStart) return 0;
  const start = new Date(semesterStart);
  const today = new Date();
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
};

/* ================= TEMPLATE DEFINITIONS ================= */
const TEMPLATE_DEFINITIONS = [
  { code: "t01", label: "Template-01: Project Team List (MS Word)", week: 1 },
  { code: "t02", label: "Template-02: Initial Proposal (MS Word)", week: 2 },
  { code: "t03", label: "Template-03: Proposal Presentation (MS PowerPoint)", week: 4 },
  { code: "t04", label: "Template-04: Proposal & Plan (MS Word)", week: 6 },
  { code: "t05", label: "Template-05: Progress Presentation (MS PowerPoint)", week: 13 },
  { code: "t06", label: "Template-06: Complete Project Report (MS Word)", week: 24 },
  { code: "t07", label: "Template-07: Final Presentation (MS PowerPoint)", week: 26 },
  { code: "t08", label: "Template-08: Complete Final Presentation (MS Word)", week: 28 },
  { code: "t09", label: "Template-09: Complete Documentation(MS Word)", week: 30 },
];

export default function StudentUploads() {
  const [allFiles, setAllFiles] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [semesterStart, setSemesterStart] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  const headers = ["Template", "Due Date", "Status", "Action"];
  const fileInputRefs = useRef({});

  const studentId = localStorage.getItem("studentId");

  const normalizeStatus = (raw) => {
    if (!raw) return "Pending";
    const map = {
      pending: "Pending",
      submitted: "Under Review",
      approved: "Approved",
      rejected: "Rejected",
    };
    return map[String(raw).toLowerCase()] || raw;
  };

  /* ================= LOAD SEMESTER START DATE ================= */
  useEffect(() => {
    const loadSemesterStart = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/semester-start");
        const data = await res.json();
        setSemesterStart(data?.date || null);
      } catch (err) {
        console.error(err);
        toastService.error("Semester start date not found");
      }
    };
    loadSemesterStart();
  }, []);

  /* ================= LOAD STUDENT INFO ================= */
  useEffect(() => {
    const loadStudentInfo = async () => {
      if (!studentId) return;
      try {
        const data = await TemplateService.getStudentInfo(studentId);
        setStudentInfo(data);
      } catch (err) {
        console.error(err);
        toastService.error("Could not load student info");
      }
    };
    loadStudentInfo();
  }, [studentId]);

  /* ================= LOAD UPLOADED FILES ================= */
  useEffect(() => {
    if (studentInfo?.groupId) loadTemplates();
  }, [studentInfo]);

  useEffect(() => {
    applyFilters();
  }, [allFiles, semesterStart]);

  /* ================= SHOW CURRENT WEEK TOAST ON PAGE LOAD ================= */
  useEffect(() => {
    if (!semesterStart) return;
    const currentWeek = getCurrentWeek(semesterStart);
    toastService.info(`📅 Current week: ${currentWeek}. Check the template to submit this week.`);
  }, [semesterStart]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const files = await TemplateService.getFiles(studentInfo.groupId);
      const normalized = files.map((f) => ({
        id: f._id,
        template: f.templateCode,
        filename: f.originalName,
        filePath: f.filePath,
        status: normalizeStatus(f.status),
      }));
      setAllFiles(normalized);
    } catch (err) {
      console.error(err);
      toastService.error("Could not load templates");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!studentInfo) return;
    const tableRows = TEMPLATE_DEFINITIONS.map((tpl) => {
      const existing = allFiles.find((f) => f.template === tpl.code);
      return {
        Template: tpl.label,
        "Due Date": calculateDueDate(semesterStart, tpl.week),
        Status: existing ? existing.status : "Pending",
        Action: existing ? "Re-upload" : "Upload",
        __meta: { template: tpl.code, file: existing },
      };
    });
    setRows(tableRows);
  };

  /* ================= FILE ACTIONS ================= */
  const buildFileUrl = (path) => TemplateService.buildFileUrl(path);

  const handleDownload = (row) => {
    const file = row.__meta.file;
    if (!file?.filePath) return;
    const a = document.createElement("a");
    a.href = buildFileUrl(file.filePath);
    a.download = file.filename;
    a.click();
  };

  const handleTriggerUpload = (tplCode) => {
    if (!fileInputRefs.current[tplCode]) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".doc,.docx,.pdf,.ppt,.pptx,.zip";
      input.onchange = (e) => handleFileSelected(e, tplCode);
      fileInputRefs.current[tplCode] = input;
    }
    fileInputRefs.current[tplCode].click();
  };

  const handleFileSelected = async (e, tplCode) => {
    const file = e.target.files?.[0];
    if (!file || !studentInfo) return;

    const templateDef = TEMPLATE_DEFINITIONS.find((t) => t.code === tplCode);
    const templateWeek = templateDef?.week || 1;
    const currentWeek = getCurrentWeek(semesterStart);

    if (templateWeek > currentWeek) {
      toastService.error(
        `🚫 Upload blocked!\nTemplate week: ${templateWeek}\nCurrent week: ${currentWeek}`
      );
      e.target.value = "";
      return;
    }

    try {
      setLoading(true);
      await TemplateService.uploadFile(tplCode, file, studentId, templateWeek);
      toastService.success(
        `✅ File uploaded successfully!\nTemplate week: ${templateWeek}\nCurrent week: ${currentWeek}`
      );
      loadTemplates();
    } catch (err) {
      console.error(err);
      toastService.error(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderActions = (row) => {
    const file = row.__meta.file;
    return (
      <Box sx={{ display: "flex", gap: 8 }}>
        {file && (
          <button
            className="mt-btn"
            style={{ background: "#2563eb" }}
            onClick={() => handleDownload(row)}
          >
            Download
          </button>
        )}
        <button
          className="mt-btn"
          style={{ background: "#10b981", color: "#fff" }}
          onClick={() => handleTriggerUpload(row.__meta.template)}
        >
          {file ? "Re-upload" : "Upload"}
        </button>
      </Box>
    );
  };

  return (
    <Box sx={{ pb: 3 }}>
      <DashboardSectionHeader description="Here you can upload your project templates or view their status.">
        Uploads Template
      </DashboardSectionHeader>

      {loading ? (
        <div className="st-loading">Loading…</div>
      ) : (
        <AppTable headers={headers} rows={rows} renderActions={renderActions} />
      )}
    </Box>
  );
}
