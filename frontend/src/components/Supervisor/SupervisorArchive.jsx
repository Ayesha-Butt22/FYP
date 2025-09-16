import React, { useState } from "react";
import {
  Box, Paper, TextField, Chip, Stack, Grid, Card, CardContent, InputAdornment, Tooltip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CodeIcon from "@mui/icons-material/Code";
import TagIcon from "@mui/icons-material/Tag";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import "./SupervisorArchive.css";

// 🔹 Import DashboardSectionHeader
import DashboardSectionHeader from "./DashboardSectionHeader";

// Dummy data
const dummyProjects = [
  {
    projectId: "proj123",
    title: "Smart Healthcare System",
    description: "A web-based system to track patient health records automatically.",
    technologies: ["React.js", "Node.js", "MongoDB"],
    tags: ["Healthcare", "Automation"],
    archivedAt: "2025-09-12"
  },
  {
    projectId: "proj124",
    title: "Online Exam Proctoring",
    description: "Detects cheating during online exams using webcam and AI.",
    technologies: ["Python", "OpenCV", "TensorFlow"],
    tags: ["Education", "AI"],
    archivedAt: "2025-07-28"
  },
  {
    projectId: "proj125",
    title: "Smart Attendance System",
    description: "Face recognition-based automatic attendance for classrooms.",
    technologies: ["React.js", "Flask", "OpenCV"],
    tags: ["Attendance", "AI", "Education"],
    archivedAt: "2025-05-13"
  }
];

export default function SupervisorArchive() {
  const [query, setQuery] = useState("");
  const [tech, setTech] = useState("");

  const filtered = dummyProjects.filter(proj => {
    const search = query.toLowerCase();
    const techSearch = tech.toLowerCase();
    const inTitle = proj.title.toLowerCase().includes(search);
    const inDesc = proj.description.toLowerCase().includes(search);
    const inTags = proj.tags.some(tag => tag.toLowerCase().includes(search));
    const techMatch = tech === "" || proj.technologies.some(t => t.toLowerCase().includes(techSearch));
    return (search === "" || inTitle || inDesc || inTags) && techMatch;
  });

  return (
    <Box className="archive-container">
      <Paper elevation={4} className="archive-paper">

        {/* ✅ Reusable Dashboard Header */}
        <Box className="archive-header">
          <DashboardSectionHeader>
            FYP Archive
          </DashboardSectionHeader>
        </Box>

        <Stack spacing={0.5} mb={3}>
          <p style={{ color: "#555", fontSize: 18, margin: 0 }}>
            Search completed FYP projects by title, technology, or keyword.
          </p>
          <b style={{ color: "#444" }}>All records are read-only.</b>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={4} alignItems="center">
          <TextField
            label="Search by Title/Keyword"
            variant="outlined"
            size="medium"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="search-input"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Technology (optional)"
            variant="outlined"
            size="medium"
            value={tech}
            onChange={e => setTech(e.target.value)}
            className="tech-input"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CodeIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <Grid container spacing={3}>
          {filtered.map(proj => (
            <Grid item xs={12} md={6} lg={4} key={proj.projectId}>
              <Card className="archive-card">
                <Box className="card-banner">
                  <span style={{ color: "#fff", fontWeight: 600 }}>{proj.title}</span>
                  <Chip
                    icon={<CalendarMonthIcon />}
                    className="archive-date"
                    size="small"
                    label={"Archived: " + new Date(proj.archivedAt).toLocaleDateString()}
                  />
                </Box>
                <CardContent>
                  <p className="card-description">{proj.description}</p>
                  <Stack direction="row" spacing={1} mb={1.3}>
                    {proj.technologies.map(t => (
                      <Tooltip title={t} key={t}>
                        <Chip icon={<CodeIcon />} label={t} variant="outlined" size="small" className="tech-chip" />
                      </Tooltip>
                    ))}
                  </Stack>
                  <Stack direction="row" spacing={1} mb={1.2}>
                    {proj.tags.map(tag => (
                      <Tooltip title={tag} key={tag}>
                        <Chip icon={<TagIcon />} label={tag} variant="outlined" size="small" className="tag-chip" />
                      </Tooltip>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {filtered.length === 0 && (
            <Grid item xs={12}>
              <Box textAlign="center" mt={8} mb={3}>
                <p style={{ color: "#888", fontSize: 22 }}>No projects found.</p>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
}
