import React, { useState } from "react";
import {
  Box, TextField, Chip, Stack, Table, TableHead, TableRow, TableCell, TableBody, Tooltip, InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CodeIcon from "@mui/icons-material/Code";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./SupervisorArchive.css";

// Dummy data (with supervisor)
const dummyProjects = [
  {
    projectId: "proj123",
    title: "Smart Attendance System",
    description: "Face recognition-based automatic attendance for classrooms.",
    technologies: ["React.js", "Flask", "OpenCV"],
    archivedAt: "2025-05-13",
    supervisor: "Dr. Ahmed"
  },
  {
    projectId: "proj124",
    title: "AI-Based Disease Prediction",
    description: "Predicts diseases using AI algorithms on patient data.",
    technologies: ["Python", "TensorFlow", "Pandas"],
    archivedAt: "2025-06-21",
    supervisor: "Dr. Ahmed"
  },
  {
    projectId: "proj125",
    title: "Online Exam Proctoring",
    description: "Detects cheating during online exams using webcam and AI.",
    technologies: ["Python", "OpenCV", "TensorFlow"],
    archivedAt: "2025-07-28",
    supervisor: "Dr. Ahmed"
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
    const techMatch = tech === "" || proj.technologies.some(t => t.toLowerCase().includes(techSearch));
    return (search === "" || inTitle || inDesc) && techMatch;
  });

  return (
    <Box className="archive-container">
      <div className="archive-header">
        <DashboardSectionHeader 
style={{ marginLeft: "35px" , marginBottom: "50px", marginTop: "-25px"
 }}>
 
          FYP Archive
        </DashboardSectionHeader>
      </div>

      <Stack spacing={0.5} mb={3}>
        <p style={{ color: "#555", fontSize: 18, margin: 0 }}>
          Search completed FYP projects by title, technology, or keyword.
        </p>
        <b style={{ color: "#444" }}>All records are read-only.</b>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3} alignItems="center">
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

      <Table className="archive-table">
        <TableHead>
          <TableRow>
            <TableCell className="archive-th">Project Name</TableCell>
            <TableCell className="archive-th">Description</TableCell>
            <TableCell className="archive-th">Technology</TableCell>
            <TableCell className="archive-th">Supervised By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" style={{ color: "#888", fontSize: 20, padding: "48px 0" }}>
                No projects found.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map(proj => (
              <TableRow key={proj.projectId} className="archive-table-row">
                <TableCell className="archive-td" style={{ fontWeight: 700, color: "#01337a" }}>{proj.title}</TableCell>
                <TableCell className="archive-td">{proj.description}</TableCell>
                <TableCell className="archive-td">
                  <Stack direction="row" spacing={1}>
                    {proj.technologies.map(t => (
                      <Tooltip title={t} key={t}>
                        <Chip icon={<CodeIcon fontSize="small" />} label={t} size="small" className="tech-chip" />
                      </Tooltip>
                    ))}
                  </Stack>
                </TableCell>
                <TableCell className="archive-td">{proj.supervisor}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
}