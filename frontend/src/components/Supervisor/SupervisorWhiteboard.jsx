// components/SupervisorWhiteboard.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Delete, FileDownload } from "@mui/icons-material";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import "./SupervisorWhiteboard.css";

const GROUPS = [
  { id: "G-101", name: "Group 1" },
  { id: "G-102", name: "Group 2" },
  { id: "G-103", name: "Group 3" },
];

// Export notes for all groups
function exportNotesAsHTML(notesByGroup) {
  const html =
    `<html><head><title>Supervisor Whiteboard Notes</title></head><body>` +
    GROUPS.map(
      (group) =>
        `<h2>${group.name} (${group.id})</h2>` +
        (notesByGroup[group.id] || [])
          .map(
            (note) =>
              `<div><em>${note.date}</em></div>${note.content}<hr/>`
          )
          .join("") +
        "<br/>"
    ).join("") +
    `</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "whiteboard-notes.html";
  a.click();
  URL.revokeObjectURL(url);
}

export default function SupervisorWhiteboard() {
  const [notesByGroup, setNotesByGroup] = useState({
    "G-101": [],
    "G-102": [],
    "G-103": [],
  });
  const [inputs, setInputs] = useState({
    "G-101": "",
    "G-102": "",
    "G-103": "",
  });
  const [errors, setErrors] = useState({
    "G-101": "",
    "G-102": "",
    "G-103": "",
  });

  const handlePost = (groupId) => {
    if (!inputs[groupId] || inputs[groupId] === "<p><br></p>") {
      setErrors((e) => ({ ...e, [groupId]: "Please write a note." }));
      return;
    }
    setNotesByGroup((prev) => ({
      ...prev,
      [groupId]: [
        {
          content: inputs[groupId],
          date: new Date().toLocaleString(),
        },
        ...prev[groupId],
      ],
    }));
    setInputs((i) => ({ ...i, [groupId]: "" }));
    setErrors((e) => ({ ...e, [groupId]: "" }));
  };

  const handleDelete = (groupId, idx) => {
    setNotesByGroup((prev) => ({
      ...prev,
      [groupId]: prev[groupId].filter((_, i) => i !== idx),
    }));
  };

  return (
    <Box>
      {/* ✅ Whiteboard heading left */}
      <Box textAlign="left" mb={2}>
        <DashboardSectionHeader>Whiteboard</DashboardSectionHeader>
      </Box>

      {/* ✅ Group boxes center aligned */}
      <Stack
        direction="row"
        spacing={3}
        justifyContent="center"
        alignItems="flex-start"
        className="group-stack"
      >
        {GROUPS.map((group) => (
          <Paper elevation={3} key={group.id} className="group-card">
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Typography className="group-title">{group.name}</Typography>
              <Tooltip title="Export notes as HTML file">
                <IconButton
                  onClick={() =>
                    exportNotesAsHTML({ [group.id]: notesByGroup[group.id] })
                  }
                  size="small"
                >
                  <FileDownload />
                </IconButton>
              </Tooltip>
            </Stack>

            <ReactQuill
              value={inputs[group.id]}
              onChange={(val) =>
                setInputs((i) => ({ ...i, [group.id]: val }))
              }
              theme="snow"
              placeholder={`Write note for ${group.name}...`}
              className="quill-editor"
              modules={{
                toolbar: [
                  [{ header: [1, 2, false] }],
                  [
                    "bold",
                    "underline",
                    "italic",
                    { color: [] },
                    { background: [] },
                  ],
                  ["clean"],
                ],
              }}
            />

            {errors[group.id] && (
              <Typography className="error-text">
                {errors[group.id]}
              </Typography>
            )}

            <Button
              color="primary"
              variant="contained"
              className="post-btn"
              onClick={() => handlePost(group.id)}
            >
              Post Note
            </Button>

            <Typography className="past-title">Past Notes</Typography>
            {notesByGroup[group.id].length === 0 && (
              <Typography className="no-notes">No notes posted yet.</Typography>
            )}

            <Stack spacing={2}>
              {notesByGroup[group.id].map((n, i) => (
                <Paper key={i} elevation={1} className="note-card">
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={0.5}
                  >
                    <Typography className="note-date">{n.date}</Typography>
                    <Tooltip title="Delete note">
                      <IconButton
                        onClick={() => handleDelete(group.id, i)}
                        size="small"
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <div
                    className="note-content"
                    dangerouslySetInnerHTML={{ __html: n.content }}
                  />
                </Paper>
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* ✅ Export button center aligned */}
      <Stack direction="row" justifyContent="center" mt={3}>
        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={() => exportNotesAsHTML(notesByGroup)}
        >
          Export All Groups Notes
        </Button>
      </Stack>
    </Box>
  );
}
