import React, { useEffect, useState, useRef } from "react";
import { Box } from "@mui/material";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import AppTable from "../Admin/AppTable.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import "./StudentUploads.css";

let TemplateService = null;
try {
  TemplateService = require("../ProjectCoordinatorApi/TemplateService.jsx").default;
} catch (e) {
  TemplateService = null;
}
const TEMPLATE_DEFINITIONS = [
  { code: "t01", label: "Template-01: Project Team (MS Word)", due: "2025-09-10" },
  { code: "t02", label: "Template-02: Initial Proposal (MS Word)", due: "2025-09-25" },
  { code: "t03", label: "Template-03: Proposal Presentation (MS PowerPoint)", due: "2025-10-10" },
  { code: "t04", label: "Template-04: Proposal & Plan (MS Word)", due: "2025-10-25" },
  { code: "t05", label: "Template-05: Project Report (MS Word)", due: "2025-11-10" },
  { code: "t06", label: "Template-06: Final Presentation (MS PowerPoint)", due: "2025-11-20" },
  { code: "t07", label: "Template-07: Progress Presentation (MS PowerPoint)", due: "2025-10-30" },
];

const MOCK_FILES = [
  {
    _id: "m1",
    template: "t03",
    templateLabel: "Template-03: Proposal Presentation (MS PowerPoint)",
    department: "SE",
    filePath: "/Filesk/mock-proposal-1.docx",
    originalName: "mock-proposal-1.docx",
    createdAt: new Date().toISOString(),
    status: "Approved",
  },
  {
    _id: "m2",
    template: "t03",
    templateLabel: "Template-03: Proposal Presentation (MS PowerPoint)",
    department: "SE",
    filePath: "/Filesk/mock-proposal-2.docx",
    originalName: "mock-proposal-2.docx",
    createdAt: new Date().toISOString(),
    status: "Under Review",
  },
  {
    _id: "m3",
    template: "t01",
    templateLabel: "Template-01: Project Team (MS Word)",
    department: "SE",
    filePath: "/Filesk/mock-team.docx",
    originalName: "mock-team.docx",
    createdAt: new Date().toISOString(),
    status: "Pending",
  },
];

export default function StudentTemplates() {
  const [allFiles, setAllFiles] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Show only this department dropdown 
  const DEPARTMENTS = ["All", "SE", "CS", "CA"];

  
  const userRoleRaw = (localStorage.getItem("role") || "").toString();
  const isStudent = /student/i.test(userRoleRaw);


  const storedDept =
    localStorage.getItem("department") ||
    localStorage.getItem("dept") ||
    localStorage.getItem("departmentCode") ||
    localStorage.getItem("userDepartment") ||
    localStorage.getItem("department_code") ||
    "";


  const [selectedDept, setSelectedDept] = useState(isStudent ? (storedDept || "All") : "All");

  const headers = ["Template", "Due Date", "Status", "Action"];

  
  const fileInputRefs = useRef({});


  const normalizeStatus = (raw) => {
    if (raw == null || raw === "") return "Pending";
    const s = String(raw).trim().toLowerCase();
    const map = {
      pending: "Pending",
      "pending review": "Pending",
      "underreview": "Under Review",
      "under review": "Under Review",
      "under-review": "Under Review",
      approved: "Approved",
      rejected: "Rejected",
      submitted: "Under Review",
      inreview: "Under Review",
      reviewing: "Under Review",
      "in progress": "Under Review",
      inprogress: "Under Review",
    };
    return map[s] || (raw ? String(raw) : "Pending");
  };

  useEffect(() => {
    loadTemplates();
  
  }, []);

  useEffect(() => {
   
    if (isStudent && storedDept && selectedDept !== storedDept) {
      setSelectedDept(storedDept);
    }
    applyFilters();
  
  }, [allFiles, selectedDept, isStudent, storedDept]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      let files = [];
      if (TemplateService && typeof TemplateService.getFiles === "function") {
        files = await TemplateService.getFiles();
      } else {
        files = MOCK_FILES;
      }

      const normalized = files.map((f) => ({
        id: f._id || f.id,
        template: (f.template || "").toString(),
        templateLabel: f.templateLabel || f.template || "Template",
        department: (f.department || "").toString(),
        filename: f.originalName || f.fileName || (f.filePath ? f.filePath.split("/").pop() : ""),
        filePath: f.filePath,
        uploadedAt: f.uploadedAt || f.createdAt || f.created_at || "",
        status: normalizeStatus(f.status || f.state || "Pending"),
        __raw: f,
      }));
      setAllFiles(normalized);
    } catch (err) {
      console.error("Could not load templates", err);
      toastService.error("Could not load templates: " + (err.message || ""));
      setAllFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const buildFileUrl = (filePath) => {
    if (TemplateService && typeof TemplateService.buildFileUrl === "function") {
      return TemplateService.buildFileUrl(filePath);
    }
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;
    return window.location.origin + filePath;
  };

  const handleView = (row) => {
    const meta = row.__meta || row;
    if (!meta || !meta.filePath) {
      toastService.error("File not available");
      return;
    }
    const url = buildFileUrl(meta.filePath);
    window.open(url, "_blank");
  };

  const handleDownload = (row) => {
    const meta = row.__meta || row;
    if (!meta || !meta.filePath) {
      toastService.error("File not available");
      return;
    }
    const url = buildFileUrl(meta.filePath);
    const a = document.createElement("a");
    a.href = url;
    const filename = row.Filename || meta.filename || url.split("/").pop();
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  function applyFilters() {
    
    const tableRows = TEMPLATE_DEFINITIONS.map((tpl) => {
     
      const matchingFile = allFiles.find((f) => {
        if ((f.template || "") !== tpl.code) return false;
        
        if (isStudent) {
          const deptToMatch = storedDept || selectedDept;
          if (!deptToMatch || deptToMatch === "All") return true;
          return f.department === deptToMatch;
        }
        if (selectedDept && selectedDept !== "All") return f.department === selectedDept;
        return true;
      });

      
      const status = matchingFile ? normalizeStatus(matchingFile.status || "Under Review") : "Pending";
      const uploadedAt = matchingFile ? (matchingFile.uploadedAt || matchingFile.__raw?.createdAt || "") : "";

      return {
        Template: tpl.label,
        "Due Date": tpl.due,
        Status: status,
        Action: matchingFile ? "Re-upload" : "Upload",
        __meta: {
          template: tpl.code,
          department: isStudent ? (storedDept || selectedDept) : selectedDept,
          file: matchingFile || null,
          uploadedAt,
        },
      };
    });

    setRows(tableRows);
  }

 
  const handleTriggerUpload = (tplCode) => {
    if (!fileInputRefs.current[tplCode]) {

      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".doc,.docx,.pdf,.ppt,.pptx,.zip";
      input.onchange = (e) => handleFileSelected(e, tplCode);
      input.style.display = "none";
      document.body.appendChild(input);
      fileInputRefs.current[tplCode] = input;
    }
    fileInputRefs.current[tplCode].click();
  };

  const handleFileSelected = async (event, tplCode) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const dept = isStudent ? (storedDept || selectedDept) : selectedDept;
    const newEntry = {
      id: `local-${Date.now()}`,
      template: tplCode,
      templateLabel: TEMPLATE_DEFINITIONS.find((t) => t.code === tplCode)?.label || tplCode,
      department: dept,
      filename: file.name,
      filePath: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      status: "Under Review", 
      __raw: { local: true },
    };

   
    if (TemplateService && typeof TemplateService.uploadFile === "function") {
      try {
        setLoading(true);
        const res = await TemplateService.uploadFile(tplCode, dept, file);
     
        if (res && res.success && res.data) {
          const d = res.data;
          const entry = {
            id: d.id || newEntry.id,
            template: tplCode,
            templateLabel: d.templateLabel || newEntry.templateLabel,
            department: dept,
            filename: d.originalName || file.name,
            filePath: d.filePath || newEntry.filePath,
            uploadedAt: d.uploadedAt || newEntry.uploadedAt,
            status: normalizeStatus(d.status || "Under Review"),
            __raw: d,
          };
          
          setAllFiles((prev) => {

            const filtered = prev.filter((p) => !(p.template === tplCode && p.department === dept));
            return [...filtered, entry];
          });
          toastService.success("File uploaded successfully.");
        } else {
          
          setAllFiles((prev) => {
            const filtered = prev.filter((p) => !(p.template === tplCode && p.department === dept));
            return [...filtered, newEntry];
          });
          toastService.success("File queued (preview).");
        }
      } catch (err) {
        console.error("Upload failed", err);
        toastService.error("Upload failed. Try again.");
      } finally {
        setLoading(false);
        applyFilters();
      }
    } else {
     
      setAllFiles((prev) => {
        const filtered = prev.filter((p) => !(p.template === tplCode && p.department === dept));
        return [...filtered, newEntry];
      });
      toastService.success("File selected (preview). It will be shown as Under Review.");
      applyFilters();
    }

    if (fileInputRefs.current[tplCode]) {
      fileInputRefs.current[tplCode].value = "";
    }
  };

  const renderActions = (row) => {
    const meta = row.__meta || {};
    const tplCode = meta.template;
    const existingFile = allFiles.find((f) => f.template === tplCode && f.department === meta.department);
    return (
      <Box sx={{ display: "flex", gap: 8, alignItems: "center" }}>
        {existingFile ? (
          <>
            <button
              className="mt-btn"
              onClick={() => handleView({ __meta: existingFile })}
              title="View"
              style={{ background: "#0b5ed7" }}
            >
              View
            </button>
            <button
              className="mt-btn"
              onClick={() => handleDownload({ __meta: existingFile })}
              title="Download"
              style={{ background: "#2563eb" }}
            >
              Download
            </button>
          </>
        ) : null}
        <button
          className="mt-btn"
          onClick={() => handleTriggerUpload(tplCode)}
          title={existingFile ? "Re-upload" : "Upload"}
          style={{ background: "#10b981", color: "#fff" }}
        >
          {existingFile ? "Re-upload" : "Upload"}
        </button>
      </Box>
    );
  };

  const clearFilters = () => {
 
    if (isStudent) {
      setSelectedDept(storedDept || "All");
      return;
    }
    setSelectedDept("All");
  };

  return (
    <Box sx={{ pb: 3 }}>
      <DashboardSectionHeader description={"Here you can upload your project templates or view their status."}>
        Uploads Template
      </DashboardSectionHeader>

      <Box className="st-controls" sx={{ mb: 1 }}>
        {!isStudent ? (
          <>
            <div className="st-filter">
              <label>Department</label>
              <select className="st-dept-select" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="st-clear-btn" onClick={clearFilters}>Clear filters</button>
            </div>
          </>
        ) : null}
      </Box>

      {loading ? (
        <div className="st-loading">Loading templates…</div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <AppTable headers={headers} rows={rows} renderActions={renderActions} />
          {rows.length === 0 && <div className="st-empty">No templates available.</div>}
        </div>
      )}
    </Box>
  );
}