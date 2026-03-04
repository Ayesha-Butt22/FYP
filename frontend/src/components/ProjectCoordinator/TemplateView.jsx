import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Modal,
  Button,
  CircularProgress,
  Chip,
  Alert,
} from "@mui/material";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import AppTable from "../Admin/AppTable.jsx";
import "./TemplateView.css";

// ─── API BASE URL ────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function getStatusColor(status) {
  switch (status) {
    case "Approved":    return "success";
    case "Rejected":    return "error";
    case "Under Review":return "warning";
    case "Pending":     return "default";
    default:            return "default";
  }
}

function getMemberNames(members = []) {
  return members.map((m) => m.name || m.email || m.sapId || "Student").join(", ") || "—";
}

function getSupervisorName(proposals = []) {
  const p = proposals[0];
  return p?.projectSupervisor || "—";
}

function getGroupOverallStatus(templates = []) {
  if (!templates.length) return "No Uploads";
  const allApproved = templates.every((t) => t.status === "Approved");
  if (allApproved) return "Approved";
  const anyRejected = templates.some((t) => t.status === "Rejected");
  if (anyRejected) return "Rejected";
  const anyReview = templates.some((t) => t.status === "Under Review");
  if (anyReview) return "Under Review";
  return "Pending";
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function TemplateView() {
  const [groups, setGroups]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const [groupView, setGroupView]     = useState(null); // { group, templates }
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // ── Auth helper ───────────────────────────────────────────────────────────
  const authHeaders = () => ({
    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
    "Content-Type": "application/json",
  });

  // ── Fetch all groups on mount ──────────────────────────────────────────────
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/groupsinfo/info`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to fetch groups");
        setGroups(json.data || []);
      } catch (err) {
        console.error("fetchGroups error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // ── Open details modal ─────────────────────────────────────────────────────
  const openGroupView = async (group) => {
    setGroupView({ group, templates: [] });
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await fetch(`${API_BASE}/student-templates/group/${group._id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch templates");
      setGroupView({ group, templates: json.data || [] });
    } catch (err) {
      console.error("fetchTemplates error:", err);
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeGroupView = () => {
    setGroupView(null);
    setDetailError(null);
  };

  // ── Table rows for groups ──────────────────────────────────────────────────
  const tableRows = groups.map((g) => ({
    "Group ID":       g.groupId || g._id,
    "Group Members":  getMemberNames(g.members),
    "Supervisor":     getSupervisorName(g.proposals),
    "Status":         g._overallStatus || "—",   // filled below
    __meta:           g,
  }));

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <Box mx="auto" py={3}>
      <DashboardSectionHeader description="Coordinator View">
        View Reports / Templates
      </DashboardSectionHeader>

      {/* ── Loading / Error ── */}
      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Groups Table ── */}
      {!loading && !error && (
        <Paper className="stv-card">
          <AppTable
            headers={["Group ID", "Group Members", "Supervisor", "Status"]}
            rows={groups.map((g) => ({
              "Group ID":      g.groupId || String(g._id).slice(-6).toUpperCase(),
              "Group Members": getMemberNames(g.members),
              "Supervisor":    getSupervisorName(g.proposals),
              "Status":        "—",   // will be dynamically loaded on open
              __meta:          g,
            }))}
            renderActions={(row) => (
              <button
                className="mt-btn"
                onClick={() => openGroupView(row.__meta)}
              >
                Details
              </button>
            )}
          />
        </Paper>
      )}

      {/* ═══════════════════ MODAL ═══════════════════ */}
      <Modal
        open={Boolean(groupView)}
        onClose={closeGroupView}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            width: "95vw",
            maxWidth: "1200px",
            maxHeight: "90vh",
            bgcolor: "white",
            borderRadius: 2,
            p: 3,
            overflow: "auto",
            boxShadow: 24,
          }}
        >
          {groupView && (
            <>
              {/* Modal Header */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Milestones — Group{" "}
                    {groupView.group.groupId ||
                      String(groupView.group._id).slice(-6).toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Members: {getMemberNames(groupView.group.members)} &nbsp;|&nbsp; Supervisor:{" "}
                    {getSupervisorName(groupView.group.proposals)}
                  </Typography>
                </Box>
                <Button variant="outlined" onClick={closeGroupView}>
                  Close
                </Button>
              </Box>

              {/* Loading / Error inside modal */}
              {detailLoading && (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              )}
              {detailError && (
                <Alert severity="error" sx={{ my: 2 }}>
                  {detailError}
                </Alert>
              )}

              {/* Templates Table */}
              {!detailLoading && !detailError && (
                <>
                  {groupView.templates.length === 0 ? (
                    <Alert severity="info">No templates uploaded by this group yet.</Alert>
                  ) : (
                    <AppTable
                      headers={[
                        "Uploaded By",
                        "Template Name",
                        "Template Label",
                        "Uploaded On",
                        "Status",
                        "Supervisor Comment",
                      ]}
                      rows={groupView.templates.map((t) => {
                        // Find uploader name from group members by studentId / sapId
                        const uploader = groupView.group.members?.find(
                          (m) => m.sapId === t.studentId || m.sapId === String(t.studentId)
                        );
                        const uploaderName = uploader?.name || t.studentId || "—";

                        return {
                          "Uploaded By":       uploaderName,
                          "Template Name":     t.originalName || t.templateCode || "—",
                          "Template Label":    t.templateLabel || "—",
                          "Uploaded On":       formatDate(t.uploadedAt),
                          "Status": (
                            <Chip
                              label={t.status || "—"}
                              color={getStatusColor(t.status)}
                              size="small"
                            />
                          ),
                          "Supervisor Comment": t.supervisorRemarks || "—",
                          __meta: t,
                        };
                      })}
                      renderActions={(row) => {
                        const t = row.__meta;
                        const fileUrl = t.filePath
                          ? `${API_BASE.replace("/api", "")}/${t.filePath.replace(/\\/g, "/")}`
                          : null;

                        return (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={!t.filePath}
                            onClick={() => {
                              if (fileUrl) window.open(fileUrl, "_blank", "noopener");
                            }}
                          >
                            Open
                          </Button>
                        );
                      }}
                    />
                  )}

                  {/* Overall group status summary */}
                  {groupView.templates.length > 0 && (
                    <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Overall Status:
                      </Typography>
                      <Chip
                        label={getGroupOverallStatus(groupView.templates)}
                        color={getStatusColor(getGroupOverallStatus(groupView.templates))}
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        {groupView.templates.filter((t) => t.status === "Approved").length} /{" "}
                        {groupView.templates.length} Approved
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}