import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Typography,
  Stack,
} from "@mui/material";
import BookIcon from "@mui/icons-material/Book";
import DashboardSectionHeader from "../Supervisor/DashboardSectionHeader";
import "./StudentWhiteboard.css";

const STORAGE_KEY = "supervisor_whiteboard_notes_v1";

// sample fallback instructions
const SAMPLE_NOTES = [
  {
    date: new Date().toLocaleString(),
    title: "Project Deliverables — SRS & Slides",
    content: `<p>Please upload your <strong>SRS</strong> and updated slide deck by <strong>3 days</strong> from now. Ensure the report includes:</p>
              <ul>
                <li>Introduction & Problem Statement</li>
                <li>Literature Review (add 2–3 recent refs)</li>
                <li>Methodology & Design</li>
                <li>Preliminary Results / Screenshots</li>
              </ul>
              <p><em>If you face issues, message me on the portal or book a meeting.</em></p>`,
  },
  {
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleString(),
    title: "Prototype Demo Preparation",
    content: `<p>Prepare a 5-minute prototype demo for the next meeting. Focus on:</p>
              <ol>
                <li>Core user-flow</li>
                <li>Key screens and interactions</li>
                <li>Known limitations</li>
              </ol>
              <p><strong>Bring a runnable build or video.</strong></p>`,
  },
  {
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toLocaleString(),
    title: "SRS: Formatting & Submission",
    content: `<p>Final SRS should follow the template in Templates & include:</p>
              <ul>
                <li>Clear acceptance criteria for each milestone</li>
                <li>References and citations in IEEE style</li>
              </ul>
              <p>Submit under <strong>Templates → SRS</strong>.</p>`,
  },
];

function safeLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function StudentWhiteboard() {
  const [notesByGroup, setNotesByGroup] = useState({});
  const [studentGroup, setStudentGroup] = useState(null);

  useEffect(() => {
    const gid =
      localStorage.getItem("groupId") ||
      localStorage.getItem("group") ||
      localStorage.getItem("group_id") ||
      null;
    setStudentGroup(gid);

    const data = safeLoad() || {};
    setNotesByGroup(data);
  }, []);

  // decide which notes to show; prefer student's group, else merged; fallback to SAMPLE_NOTES
  const notesToShow = (() => {
    let notes = [];
    if (
      studentGroup &&
      Array.isArray(notesByGroup[studentGroup]) &&
      notesByGroup[studentGroup].length > 0
    ) {
      notes = notesByGroup[studentGroup];
    } else {
      const merged = Object.values(notesByGroup).flat();
      if (merged.length > 0) notes = merged;
    }
    if (!notes || notes.length === 0) return SAMPLE_NOTES;
    return notes
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  })();

  return (
    <Box className="student-whiteboard-root" aria-live="polite">
      <DashboardSectionHeader description="Read instructions from your supervisor. Check this regularly for updates and action items.">
        Supervisor Instructions
      </DashboardSectionHeader>

      <Stack spacing={2} sx={{ mt: 2 }}>
        {notesToShow.map((note, idx) => (
          <Card
            className="sw-card"
            key={idx}
            elevation={1}
            role="article"
            aria-label={`Supervisor note ${idx + 1}`}
          >
            <CardHeader
              avatar={
                <Avatar className="sw-avatar" aria-hidden>
                  <BookIcon />
                </Avatar>
              }
              title={<label>{note.title || "Instruction"}</label>}
              subheader={
                <Typography
                  variant="caption"
                  className="sw-date"
                  sx={{ fontSize: "19px" }}
                >
                  {note.date}
                </Typography>
              }
            />

            <CardContent className="sw-card-content">
          
              <div
                className="sw-content-html"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
