import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import { fetchSupervisorProposals } from "../Api/Proposals/supervisorReviewApi.jsx";
import SupervisorWhiteboardApi from "../Api/Proposals/supervisorWhiteboardApi.jsx";
import "./SupervisorWhiteboard.css";

// Export notes as HTML
function exportNotesAsHTML(notesByGroup) {
  const html =
    `<html><head><title>Supervisor Whiteboard Notes</title></head><body>` +
    Object.keys(notesByGroup)
      .map((groupId) => {
        const notes = notesByGroup[groupId];
        return (
          `<h2>${groupId}</h2>` +
          notes
            .map(
              (note) => `<div><em>${note.date}</em></div>${note.content}<hr/>`
            )
            .join("") +
          "<br/>"
        );
      })
      .join("") +
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
  const [groups, setGroups] = useState([]);
  const [notesByGroup, setNotesByGroup] = useState({});
  const [inputs, setInputs] = useState({});
  const [errors, setErrors] = useState({});

  // Fetch groups and initialize state
  useEffect(() => {
    const fetchGroups = async () => {
      const data = await fetchSupervisorProposals();
      const filteredGroups = data.map((proposal) => {
        const group = proposal.groupId;
        return {
          id: group.groupId,
          projectTitle: proposal.projectTitle,
          members: [
            group.leader?.email,
            group.member2?.email,
            group.member3?.email,
          ].filter(Boolean),
        };
      });

      setGroups(filteredGroups);

      const notesInit = {};
      const inputsInit = {};
      const errorsInit = {};
      filteredGroups.forEach((g) => {
        notesInit[g.id] = [];
        inputsInit[g.id] = "";
        errorsInit[g.id] = "";
      });
      setNotesByGroup(notesInit);
      setInputs(inputsInit);
      setErrors(errorsInit);
    };
    fetchGroups();
  }, []);

 useEffect(() => {
  const fetchAllNotes = async () => {
    try {
      const groupedNotes = await SupervisorWhiteboardApi.getAllByGroups();
      console.log("Fetched grouped notes:", groupedNotes);

      // Merge only if the API actually returned something
      if (groupedNotes && typeof groupedNotes === "object") {
        setNotesByGroup((prev) => {
          const updated = { ...prev };
          Object.keys(groupedNotes).forEach((groupId) => {
            updated[groupId] = groupedNotes[groupId];
          });
          return updated;
        });
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  };
  fetchAllNotes();
}, []);


  // Post a new note
  const handlePost = async (groupId) => {
    if (!inputs[groupId] || inputs[groupId] === "<p><br></p>") {
      setErrors((e) => ({ ...e, [groupId]: "Please write a note." }));
      return;
    }

    const newNote = {
      groupId,
      description: inputs[groupId],
      supervisorEmail: localStorage.getItem("email") || "supervisor@gmail.com",
      timestamp: new Date(),
    };

    const created = await SupervisorWhiteboardApi.create(newNote);
    if (created) {
      setNotesByGroup((prev) => ({
        ...prev,
        [groupId]: [
          { content: inputs[groupId], date: new Date().toLocaleString(), _id: created._id },
          ...prev[groupId],
        ],
      }));
      setInputs((i) => ({ ...i, [groupId]: "" }));
      setErrors((e) => ({ ...e, [groupId]: "" }));
    }
  };

  // Delete a note from backend and update state
  const handleDelete = async (groupId, idx) => {
    const noteId = notesByGroup[groupId][idx]._id;
    const deleted = await SupervisorWhiteboardApi.delete(noteId);
    if (deleted) {
      setNotesByGroup((prev) => ({
        ...prev,
        [groupId]: prev[groupId].filter((_, i) => i !== idx),
      }));
    }
  };

  return (
    <Box>
      <DashboardSectionHeader
        description="Here you can post notes for all FYP groups. Click 'Post Note' to send a note to a group, and view past notes below."
      >
        Whiteboard
      </DashboardSectionHeader>

      <Box mb={2} textAlign="center">
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => exportNotesAsHTML(notesByGroup)}
        >
          Export Notes
        </Button>
      </Box>

      <Stack direction="row" spacing={3} justifyContent="center" alignItems="flex-start" className="group-stack">
        {groups.map((group) => (
          <Paper key={group.id} elevation={3} className="whiteboardsup-group-card">
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Typography className="group-title">{group.projectTitle}</Typography>
            </Stack>

            <Typography variant="body2" color="textSecondary" mb={1}>
              {group.members.map((member, index) => (
                <div style={{ fontSize: 18, color: "#000" }} key={index}>{member}</div>
              ))}
            </Typography>

            <ReactQuill
              value={inputs[group.id]}
              onChange={(val) => setInputs((i) => ({ ...i, [group.id]: val }))}
              theme="snow"
              placeholder={`Write note for ${group.projectTitle}...`}
              className="quill-editor"
              modules={{
                toolbar: [
                  [{ header: [1, 2, false] }],
                  ["bold", "underline", "italic", { color: [] }, { background: [] }],
                  ["clean"],
                ],
              }}
            />

            {errors[group.id] && <Typography className="error-text">{errors[group.id]}</Typography>}

            <Button color="primary" variant="contained" className="post-btn" onClick={() => handlePost(group.id)}>
              Post Note
            </Button>

            <Typography className="past-title">Past Notes</Typography>
            {notesByGroup[group.id]?.length === 0 && <Typography className="no-notes">No notes posted yet.</Typography>}

            <Stack spacing={2}>
              {notesByGroup[group.id]?.map((n, i) => (
                <Paper key={i} elevation={1} className="note-card">
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography className="note-date">{n.date}</Typography>
                    <Tooltip title="Delete note">
                      <IconButton onClick={() => handleDelete(group.id, i)} size="small" color="error">
                        <Delete fontSize="medium" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <div className="note-content" dangerouslySetInnerHTML={{ __html: n.content }} />
                </Paper>
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
