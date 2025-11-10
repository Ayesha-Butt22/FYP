import React, {useEffect, useState} from "react";
import {Box, Stack, Chip, Tooltip, TextField, Typography} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CodeIcon from "@mui/icons-material/Code";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable";
import "./SupervisorArchive.css";

// Dummy data 
const dummyProjects = [
    {
        projectId: "proj123",
        title: "Smart Attendance System",
        description: "Face recognition-based automatic attendance for classrooms.",
        technologies: ["React.js", "Flask", "OpenCV"],
        archivedAt: "2025-05-13",
        supervisor: "Dr. Ahmed",
    },
    {
        projectId: "proj124",
        title: "AI-Based Disease Prediction",
        description: "Predicts diseases using AI algorithms on patient data.",
        technologies: ["Python", "TensorFlow", "Pandas"],
        archivedAt: "2025-06-21",
        supervisor: "Dr. Ahmed",
    },
    {
        projectId: "proj125",
        title: "Online Exam Proctoring",
        description: "Detects cheating during online exams using webcam and AI.",
        technologies: ["Python", "OpenCV", "TensorFlow"],
        archivedAt: "2025-07-28",
        supervisor: "Dr. Ahmed",
    },
];

export default function SupervisorArchive() {
    const [query, setQuery] = useState("");
    const [tech, setTech] = useState("");
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        
        // load demo data (replace with API when available)
        setProjects(dummyProjects);
    }, []);

    const filtered = projects.filter((proj) => {
        const search = query.toLowerCase();
        const techSearch = tech.toLowerCase();
        const inTitle = proj.title.toLowerCase().includes(search);
        const inDesc = proj.description.toLowerCase().includes(search);
        const techMatch =
            tech === "" ||
            proj.technologies.some((t) => t.toLowerCase().includes(techSearch));
        return (search === "" || inTitle || inDesc) && techMatch;
    });

    const headers = ["Project Name", "Description", "Technology", "Supervised By"];

    const rows = filtered.map((proj) => ({
        "Project Name": (
            <div style={{fontWeight: 700, color: "#01337a"}}>{proj.title}</div>
        ),
        Description: proj.description,
        Technology: (
            <Stack direction="row" spacing={1}>
                {proj.technologies.map((t) => (
                    <Tooltip title={t} key={t}>
                        <Chip
                            icon={<CodeIcon fontSize="small"/>}
                            label={t}
                            size="small"
                            className="tech-chip"
                        />
                    </Tooltip>
                ))}
            </Stack>
        ),
        "Supervised By": proj.supervisor,
    }));

    return (
        <Box>
            <DashboardSectionHeader
                description={`Here you can preview group records. Search functionality can be used to find records by project name, description, or technologies used.`}
            >
                FYP Archive
            </DashboardSectionHeader>

            <Box className="archive-container">

                <Stack
                    direction={{xs: "column", sm: "row"}}
                    spacing={2}
                    mb={3}
                    alignItems="center"
                    className="archive-search-row"
                >
                    <TextField
                        label="Search by Title"
                        variant="outlined"
                        size="small"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="archive-textfield"
                        InputProps={{
                            startAdornment: <SearchIcon color="primary" sx={{mr: 1}}/>,
                        }}
                        sx={{
                            minWidth: { xs: "100%", sm: 360 },
                            "& .MuiInputBase-input": {
                                fontSize: "1rem",
                                padding: "15px 11px",
                            },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                            },
                        }}
                    />

                    <TextField
                        label="Technology"
                        variant="outlined"
                        size="small"
                        value={tech}
                        onChange={(e) => setTech(e.target.value)}
                        className="archive-textfield"
                        InputProps={{
                            startAdornment: <CodeIcon color="action" sx={{mr: 1}}/>,
                        }}
                        sx={{
                            minWidth: { xs: "100%", sm: 360 },
                            "& .MuiInputBase-input": {
                                fontSize: "1rem",
                                padding: "15px 11px",
                            },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                            },
                        }}
                    />

                    <Box sx={{marginLeft: "auto", display: "flex", alignItems: "center", gap: 2}}>
                        <Typography variant="body2" color="#475569">
                            Showing <strong>{filtered.length}</strong> of {projects.length}
                        </Typography>
                    </Box>
                </Stack>


                <div style={{maxWidth: "100%"}}>
                    <AppTable headers={headers} rows={rows}/>
                    {rows.length === 0 && (
                        <div
                            style={{
                                textAlign: "center",
                                color: "#888",
                                padding: "28px 0",
                                fontSize: 18,
                            }}
                        >
                            No projects found.
                        </div>
                    )}
                </div>
              <Stack spacing={0.5} mt={2} ml={2}>
  <Typography
    variant="subtitle2"
    color=" #01337a"
    sx={{ fontWeight: 700, fontSize: "1.8rem" }}
  >
    All records are read-only.
  </Typography>
</Stack>

            </Box>
        </Box>
    );
}