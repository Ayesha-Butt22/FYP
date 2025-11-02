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
import SupervisorWhiteboardApi from "../Api/Proposals/supervisorWhiteboardApi.jsx";

export default function StudentWhiteboard() {
  const [notesByGroup, setNotesByGroup] = useState({});
  const email = localStorage.getItem("email");

  useEffect(() => {
    const fetchNotes = async () => {
      if (!email) return;
      const data = await SupervisorWhiteboardApi.StudentWhiteboard(email);
      if (data.success && data.notes.length > 0) {
        setNotesByGroup(data.notes);
      } else {
        setNotesByGroup([]);
      }
    };
    fetchNotes();
  }, [email]);


  const notesToShow = (() => {
    let notes = [];
    const merged = Object.values(notesByGroup).flat();
    if (merged.length > 0) notes = merged;
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
