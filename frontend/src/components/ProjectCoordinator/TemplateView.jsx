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

const DUMMY_TEMPLATES = [
  {
    id: "g1-t1",
    groupId: "G-101",
    groupMembers: "Ali, Hamza, Usman",
    supervisedBy: "Dr Rimsha",
    uploadedBy: "Ali",
    templateName: "Proposal.pdf",
    templateUrl: "https://example.com/g101-1",
    uploadedAt: new Date().toISOString(),
    status: "Submitted",
    supervisorComment: "Good start.",
  },
  {
    id: "g1-t2",
    groupId: "G-101",
    groupMembers: "Ali, Hamza, Usman",
    supervisedBy: "Dr Rimsha",
    uploadedBy: "Hamza",
    templateName: "SRS.pdf",
    templateUrl: "",
    uploadedAt: "",
    status: "Not Submitted",
    supervisorComment: "",
  },
];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "—";
  }
}

export default function TemplateView() {
  const [templates, setTemplates] = useState([]);
  const [groupView, setGroupView] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_TEMPLATES));
    setTemplates(DUMMY_TEMPLATES);
  }, []);

  const groups = Array.from(new Set(templates.map((t) => t.groupId))).sort();

  const tableRows = groups.map((g) => {
    const groupTemplates = templates.filter((t) => t.groupId === g);
    const submittedCount = groupTemplates.filter((t) => t.status === "Submitted").length;

    return {
      Group: g,
      "Group Members": groupTemplates[0]?.groupMembers || "—",
      "Supervisor": groupTemplates[0]?.supervisedBy || "—",
      Status:
        submittedCount === groupTemplates.length
          ? "Submitted"
          : "Not Submitted",
      __meta: { groupId: g },
    };
  });

  const openGroupView = (groupId) => {
    const items = templates.filter((t) => t.groupId === groupId);
    setGroupView({ groupId, items });
  };

  const closeGroupView = () => setGroupView(null);

  return (
    <Box mx="auto" py={3}>
      <DashboardSectionHeader description="Coordinator View">
        View Reports / Templates
      </DashboardSectionHeader>

      <Paper className="stv-card">
        <AppTable
          headers={["Group", "Group Members", "Supervisor", "Status"]}
          rows={tableRows}
          renderActions={(row) => (
            <button
              className="mt-btn"
              onClick={() => openGroupView(row.__meta.groupId)}
            >
              Details
            </button>
          )}
        />
      </Paper>

      {/* ================= MODAL ================= */}
      <Modal
        open={Boolean(groupView)}
        onClose={closeGroupView}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "95vw",
            maxWidth: "1100px",
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
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography sx={{ fontWeight: 800 }}>
                  Templates for {groupView.groupId}
                </Typography>
                <Button onClick={closeGroupView}>Close</Button>
              </Box>

              <AppTable
                headers={[
                  "Uploaded By",
                  "Template Name",
                  "Uploaded Template URL",
                  "Uploaded On",
                  "Status",
                  "Supervisor Comment",
                ]}
                rows={groupView.items.map((it) => ({
                  "Uploaded By": it.uploadedBy,
                  "Template Name": it.templateName,
                  "Uploaded Template URL": it.templateUrl
                    ? "Available"
                    : "Not Uploaded",
                  "Uploaded On": formatDate(it.uploadedAt),
                  Status: it.status,
                  "Supervisor Comment": it.supervisorComment || "—",
                  __meta: it,
                }))}
                renderActions={(row) => {
                  const meta = row.__meta;

                  return (
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!meta.templateUrl}
                      onClick={() =>
                        meta.templateUrl &&
                        window.open(meta.templateUrl, "_blank", "noopener")
                      }
                    >
                      Open
                    </Button>
                  );
                }}
              />
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}