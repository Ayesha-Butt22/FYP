import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Tooltip,
  Modal,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
} from "@mui/material";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import "./TemplateView.css";

/**
 * TemplateView — updated so the top-level "View" button opens the Drive link directly.
 * - Clicking "View" on a group will open the group's Drive folder URL constructed from the groupId.
 * - If you prefer to open the first file's driveLink instead, I can adjust that easily.
 * - Modal for group details is still available (it opens via other UI if needed) — unchanged.
 */

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

  // open modal that lists all templates for a group (so user can see drive links)
  const openGroupView = (groupId) => {
    const items = templates.filter((t) => t.groupId === groupId);
    setGroupView({ groupId, items });
  };

  const closeGroupView = () => setGroupView(null);

  // Open a file drive link (if present) or a fallback dummy url
  const openDriveFile = (driveLink, groupId) => {
    const url = driveLink && driveLink.trim()
      ? driveLink
      : `https://example.com/student/${encodeURIComponent(groupId)}`;
    window.open(url, "_blank", "noopener");
  };

  // Open the group's Drive folder URL constructed from groupId (used by View)
  const openGroupDriveFolder = (groupId) => {
    // If you have a real folder mapping, replace this construction with the actual folder URL.
    const folderUrl = `https://drive.google.com/drive/folders/${encodeURIComponent(groupId)}`;
    window.open(folderUrl, "_blank", "noopener");
  };

  return (
    <Box mx="auto" py={3}>
      <DashboardSectionHeader description="Coordinator view: groups only. Click View to open the group's Drive folder.">
        View Reports / Templates
      </DashboardSectionHeader>

      <Paper className="stv-card">
        <Box className="stv-controls">
          <Box sx={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="filter-status-label">Status</InputLabel>
              <Select labelId="filter-status-label" value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {uniqStatus.concat(STATUS_OPTIONS.filter((s) => !uniqStatus.includes(s))).map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="filter-group-label">Group</InputLabel>
              <Select labelId="filter-group-label" value={filterGroup} label="Group" onChange={(e) => setFilterGroup(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {uniqGroups.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField size="small" placeholder="Search supervised by or group..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ color: "#64748b" }}>{filtered.length} files</Typography>
          </Box>
        </Box>

        <Table className="stv-table">
          <TableHead>
            <TableRow>
              <TableCell>Group</TableCell>
              <TableCell>Supervised By</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">View</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.groupId} hover>
                <TableCell>{t.groupId}</TableCell>
                <TableCell>{t.supervisedBy || assignedSup[t.groupId] || "—"}</TableCell>
                <TableCell>{t.department || "—"}</TableCell>
                <TableCell>
                  <Typography className={`stv-status stv-status-${String(t.status).toLowerCase().replace(/\s+/g, "")}`}>{t.status}</Typography>
                </TableCell>

                <TableCell align="right">
                  <Box style={{ display: "flex", justifyContent: "flex-end" }}>
                    {/* View button now opens the group's Drive folder directly */}
                    <Button variant="outlined" size="small" onClick={() => openGroupDriveFolder(t.groupId)}>
                      View
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" style={{ color: "#9aa4b2", padding: "28px 0" }}>
                  No templates match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Group modal: still available if you want to open via other UI (not used by the top View button now) */}
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

              <Box className="stv-preview-body">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Uploaded By</TableCell>
                      <TableCell>Uploaded On</TableCell>
                      <TableCell>On-time?</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Drive</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {groupView.items.map((it) => {
                      const onTime = checkOnTimeByGroup(it, deadlines);
                      return (
                        <TableRow key={it.id} hover>
                          <TableCell>{it.uploadedBy}</TableCell>
                          <TableCell>{formatDate(it.uploadedAt)}</TableCell>
                          <TableCell>
                            {onTime === null ? <Typography sx={{ color: "#64748b" }}>No deadline</Typography> : onTime ? <Typography className="stv-on-time">On time</Typography> : <Typography className="stv-late">Late</Typography>}
                          </TableCell>

                          <TableCell>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                              <Select value={it.status} onChange={(e) => updateStatus(it.id, e.target.value)}>
                                {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </TableCell>

                          <TableCell align="right">
                            <Button variant="outlined" size="small" onClick={() => openDriveFile(it.driveLink, it.groupId)}>Open in Drive</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}