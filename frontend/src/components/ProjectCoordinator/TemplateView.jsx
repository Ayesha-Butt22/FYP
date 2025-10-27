import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Modal,
  Button,
} from "@mui/material";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import "./TemplateView.css";

const STORAGE_KEY = "pc_student_templates";
const DEADLINE_KEY = "pc_deadlines";

const STATUS_OPTIONS = ["Submitted", "Under Review", "Reviewed", "Approved", "Rejected"];

const DUMMY_TEMPLATES = [
  {
    id: "t-001",
    uploadedBy: "Ali Raza",
    supervisedBy: "",
    groupId: "G-101",
    department: "SE",
    templateName: "Proposal_Template_G101.pdf",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    mime: "application/pdf",
    dataUrl: "",
    driveLink: "https://drive.google.com/file/d/DRIVE_ID_1/view",
    status: "Submitted",
  },
  {
    id: "t-002",
    uploadedBy: "Ayesha Butt",
    supervisedBy: "",
    groupId: "G-102",
    department: "CS",
    templateName: "SRS_G102.docx",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    dataUrl: "",
    driveLink: "https://drive.google.com/file/d/DRIVE_ID_2/view",
    status: "Submitted",
  },
  {
    id: "t-003",
    uploadedBy: "Fatima Noor",
    supervisedBy: "",
    groupId: "G-103",
    department: "IT",
    templateName: "Design_G103.pdf",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    mime: "application/pdf",
    dataUrl: "",
    driveLink: "https://drive.google.com/file/d/DRIVE_ID_3/view",
    status: "Reviewed",
  },
];

const AUTO_SUPERVISORS = [
  "Dr Rimsha",
  "Dr Bilal",
  "Dr Ayesha",
  "Dr Saeed",
  "Dr Ahmed",
  "Dr Sana",
  "Dr Hira",
];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function readDeadlinesFromStorage() {
  try {
    const raw = localStorage.getItem(DEADLINE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to parse deadlines from storage", e);
    return [];
  }
}

function checkOnTimeByGroup(template, deadlines) {
  if (!template || !template.groupId) return null;
  const match = deadlines.find((d) => d.groupId === template.groupId);
  if (!match) return null;
  try {
    const due = new Date(match.dueDate);
    const uploaded = new Date(template.uploadedAt);
    return uploaded <= due;
  } catch {
    return null;
  }
}

export default function TemplateView() {
  const [templates, setTemplates] = useState([]);
  const [groupView, setGroupView] = useState(null); // { groupId, items: [...] }
  // filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [search, setSearch] = useState("");
  const [deadlines, setDeadlines] = useState([]);
  const [assignedSup, setAssignedSup] = useState({});

  useEffect(() => {
    let loaded = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        loaded = JSON.parse(raw);
      } else {
        loaded = DUMMY_TEMPLATES;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_TEMPLATES));
      }
    } catch (err) {
      console.warn("Failed to read templates from storage", err);
      loaded = DUMMY_TEMPLATES;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_TEMPLATES));
    }

    // auto-assign supervisors per group if missing
    const groups = Array.from(new Set(loaded.map((t) => t.groupId))).sort();
    const map = {};
    let idx = 0;
    groups.forEach((g) => {
      const existing = loaded.find((t) => t.groupId === g && t.supervisedBy && t.supervisedBy.trim());
      if (existing) {
        map[g] = existing.supervisedBy;
      } else {
        map[g] = AUTO_SUPERVISORS[idx % AUTO_SUPERVISORS.length];
        idx += 1;
      }
    });

    const updatedTemplates = loaded.map((t) => ({
      ...t,
      supervisedBy: t.supervisedBy && t.supervisedBy.trim() ? t.supervisedBy : map[t.groupId],
    }));

    setAssignedSup(map);
    setTemplates(updatedTemplates);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
    } catch (e) {
      console.warn("Failed to persist assigned supervisors", e);
    }

    setDeadlines(readDeadlinesFromStorage());
  }, []);

  const persistTemplates = (updated) => {
    setTemplates(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist templates:", e);
    }
  };

  const updateStatus = (templateId, newStatus) => {
    const updated = templates.map((t) => (t.id === templateId ? { ...t, status: newStatus } : t));
    persistTemplates(updated);
    setGroupView((gv) => (gv ? { ...gv, items: gv.items.map((i) => (i.id === templateId ? { ...i, status: newStatus } : i)) } : gv));
  };

  const uniqGroups = Array.from(new Set(templates.map((t) => t.groupId))).sort();
  const uniqStatus = Array.from(new Set(templates.map((t) => t.status))).sort();

  const filtered = templates.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterGroup && t.groupId !== filterGroup) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.groupId.toLowerCase().includes(q) || (t.supervisedBy || "").toLowerCase().includes(q);
    }
    return true;
  });

  // Build rows by unique groups (use first template for representative values)
  const groups = Array.from(new Set(filtered.map((t) => t.groupId))).sort();
  const tableRows = groups.map((g) => {
    const rep = filtered.find((t) => t.groupId === g) || templates.find((t) => t.groupId === g) || {};
    return {
      Group: g,
      "Supervised By": rep.supervisedBy || assignedSup[g] || "—",
      Department: rep.department || "—",
      Status: rep.status || "—",
      __meta: { groupId: g, representative: rep },
    };
  });

  const openGroupView = (groupId) => {
    const items = templates.filter((t) => t.groupId === groupId);
    setGroupView({ groupId, items });
  };

  const closeGroupView = () => setGroupView(null);

  const openDriveFile = (driveLink, groupId) => {
    const url = driveLink && driveLink.trim()
      ? driveLink
      : `https://example.com/student/${encodeURIComponent(groupId)}`;
    window.open(url, "_blank", "noopener");
  };

  const openGroupDriveFolder = (groupId) => {
    const folderUrl = `https://drive.google.com/drive/folders/${encodeURIComponent(groupId)}`;
    window.open(folderUrl, "_blank", "noopener");
  };

  const headers = ["Group", "Supervised By", "Department", "Status"];

  const renderActions = (row) => {
    const groupId = row.__meta?.groupId;
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button className="mt-btn" onClick={() => openGroupView(groupId)} style={{ background: "#01337a" }}>Details</button>
      </div>
    );
  };

  const clearFilters = () => {
    setFilterStatus("");
    setFilterGroup("");
    setSearch("");
  };

  return (
    <Box mx="auto" py={3}>
      <DashboardSectionHeader description="Coordinator view: groups only. Click View to open the group's Drive folder.">
        View Reports / Templates
      </DashboardSectionHeader>

      <Paper className="stv-card">
        {/* top controls: use StudentTemplates-style controls (st-controls) for visual parity */}
        <Box className="st-controls" sx={{ mb: 1 }}>
          <div className="st-filter">
            <label>Status</label>
            <select
              className="st-dept-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              {uniqStatus.concat(STATUS_OPTIONS.filter((s) => !uniqStatus.includes(s))).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="st-filter">
            <label>Group</label>
            <select
              className="st-dept-select"
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
            >
              <option value="">All</option>
              {uniqGroups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="st-filter" style={{ minWidth: 240 }}>
            <label>Search</label>
            <input
              className="st-dept-select"
              type="text"
              placeholder="Search supervised by or group..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="st-clear-btn" onClick={clearFilters}>Clear filters</button>
          </div>
        </Box>

        <Box style={{ marginTop: 8 }}>
          <AppTable headers={headers} rows={tableRows} renderActions={(r) => renderActions(r)} />
        </Box>
      </Paper>

      <Modal open={Boolean(groupView)} onClose={closeGroupView} aria-labelledby="group-view-title">
        <Box className="stv-student-modal">
          {groupView && (
            <>
              <Box className="stv-preview-header" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography id="group-view-title" sx={{ fontWeight: 800 }}>Uploads for {groupView.groupId}</Typography>
                <Box>
                  <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={() => openGroupDriveFolder(groupView.groupId)}>
                    Open Group Drive
                  </Button>
                  <Button onClick={closeGroupView} variant="text">Close</Button>
                </Box>
              </Box>

              <Box className="stv-preview-body" sx={{ mt: 2 }}>
                <Box sx={{ width: "100%", overflowX: "auto" }}>
                  <AppTable
                    headers={["Uploaded By", "Uploaded On", "On-time?", "Status", "Drive"]}
                    rows={groupView.items.map((it) => ({
                      "Uploaded By": it.uploadedBy,
                      "Uploaded On": it.uploadedAt ? formatDate(it.uploadedAt) : "—",
                      "On-time?": checkOnTimeByGroup(it, deadlines) === null ? "No deadline" : (checkOnTimeByGroup(it, deadlines) ? "On time" : "Late"),
                      Status: it.status,
                      __meta: it,
                    }))}
                    renderActions={(row) => {
                      const meta = row.__meta;
                      return (
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button className="mt-btn" onClick={() => openDriveFile(meta.driveLink, meta.groupId)}>Open in Drive</button>
                        </div>
                      );
                    }}
                  />
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}