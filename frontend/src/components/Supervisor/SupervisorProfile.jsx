import React, { useState } from "react";
import { FaUserTie, FaEnvelope, FaLightbulb, FaPlusCircle, FaTrash, FaPlus } from "react-icons/fa";
import DashboardSectionHeader from "../../components/Supervisor/DashboardSectionHeader";
import { Chip, TextField, Button, IconButton, Box } from "@mui/material";

export default function SupervisorProfile({ supervisorInfo }) {
  // Supervisor can add/remove skills dynamically
  const [skills, setSkills] = useState([
    { label: "Python", color: "#2563eb", percent: 90 },
    { label: "React", color: "#fbc73d", percent: 85 },
    { label: "AI/ML", color: "#16a34a", percent: 95 },
    { label: "Node.js", color: "#f43f5e", percent: 70 }
  ]);
  const [newSkill, setNewSkill] = useState("");
  const [newSkillPercent, setNewSkillPercent] = useState("");
  const [newSkillColor, setNewSkillColor] = useState("#2563eb");

  const expertiseTags = ["AI", "ML", "Web"];
  const [ideas, setIdeas] = useState([
    "AI-Based Disease Prediction",
    "Smart Attendance System",
    "Online Exam Proctoring",
  ]);
  const [newIdea, setNewIdea] = useState("");

  const mainBlue = "#01337a";
  const accentBlue = "#2563eb";

  // Skills handlers
  const handleSkillAdd = () => {
    const trimmed = newSkill.trim();
    const percent = parseInt(newSkillPercent, 10);
    if (
      trimmed &&
      !skills.some(s => s.label.toLowerCase() === trimmed.toLowerCase()) &&
      !isNaN(percent) &&
      percent >= 1 &&
      percent <= 100
    ) {
      setSkills([...skills, { label: trimmed, color: newSkillColor, percent }]);
      setNewSkill("");
      setNewSkillPercent("");
      setNewSkillColor("#2563eb");
    }
  };

  const handleSkillRemove = (label) => {
    setSkills(skills.filter(s => s.label !== label));
  };

  // Ideas handlers
  const handleAddIdea = () => {
    const trimmed = newIdea.trim();
    if (trimmed && !ideas.includes(trimmed)) {
      setIdeas([...ideas, trimmed]);
      setNewIdea("");
    }
  };

  const handleRemoveIdea = (idea) => {
    setIdeas(ideas.filter(i => i !== idea));
  };

  return (
    <div style={{
      background: "#f9fafd",
      minHeight: "100vh",
      fontFamily: "'Inter', 'Roboto', Arial, sans-serif"
    }}>
      <div style={{
        marginLeft: "101px",
        marginBottom: "50px",
        marginTop: "-20px",
        paddingTop: "32px"
      }}>
        <DashboardSectionHeader style={{marginBottom: "40px", marginTop: "20px" }}>
          Profile
        </DashboardSectionHeader>
        <div style={{
          display: "flex",
          gap: 36,
          alignItems: "flex-start",
          flexWrap: "wrap"
        }}>
          {/* Sidebar/Profile Section */}
          <div style={{
            width: 370,
            minHeight: 320,
            background: "#fff",
            borderRadius: 32,
            boxShadow: "0 8px 32px rgba(37,99,235,0.11)",
            padding: "44px 26px 32px 26px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 275
          }}>
            <div style={{
              background: "#2563eb22",
              borderRadius: "50%",
              width: 100,
              height: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18
            }}>
              <FaUserTie size={56} color={accentBlue} />
            </div>
            <div style={{ fontWeight: 900, color: mainBlue, fontSize: 27, textAlign: "center" }}>
              {supervisorInfo?.name || "Supervisor"}
            </div>
            <div style={{ fontWeight: 600, color: accentBlue, fontSize: 17, marginTop: 2, textAlign: "center" }}>
              {supervisorInfo?.subtitle || "AI, ML, Software Engineering"}
            </div>
            <div style={{
              fontSize: 15,
              color: "#444",
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 7,
              justifyContent: "center",
              wordBreak: "break-all"
            }}>
              <FaEnvelope style={{ color: accentBlue }} /> {supervisorInfo?.email || "ayesha@riphah.edu.pk"}
            </div>
            {/* Expertise Tags Box */}
            <div style={{
              background: "#f8fafc",
              borderRadius: 14,
              marginTop: 22,
              padding: "13px 14px 8px 14px",
              width: "100%",
              textAlign: "left",
              boxShadow: "0 2px 10px rgba(37,99,235,0.04)"
            }}>
              <div style={{ color: "#222", fontWeight: 700, fontSize: 15, marginBottom: 5, letterSpacing: 0.5 }}>
                Expertise Tags
              </div>
              <div>
                {expertiseTags.map((tag, i) => (
                  <span key={i} style={{
                    background: "#2563eb11",
                    color: accentBlue,
                    fontWeight: 800,
                    borderRadius: 8,
                    padding: "2px 12px",
                    fontSize: 14,
                    marginRight: 8,
                    marginBottom: 4,
                    display: "inline-block"
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Main Profile Content */}
          <div style={{
            flex: 1,
            minWidth: 370,
            marginLeft: 0,
            marginRight: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 28
          }}>
            {/* Skills Bar Section */}
            <div style={{
              background: "#fff",
              borderRadius: 28,
              boxShadow: "0 6px 24px rgba(37,99,235,0.08)",
              padding: "31px 40px",
              marginBottom: 0
            }}>
              <div style={{ color: mainBlue, fontWeight: 800, fontSize: 21, marginBottom: 17, display: "flex", alignItems: "center", gap: 8 }}>
                My Current Skill
                <Chip size="small" label="Top Skills" sx={{ background: "#2563eb11", color: accentBlue, fontWeight: 800, fontSize: 14, ml: 1, letterSpacing: 0.5 }} />
              </div>
              {skills.map(skill => (
                <div key={skill.label} style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: accentBlue, fontSize: 16, marginBottom: 7 }}>{skill.label}</div>
                    <div style={{ background: "#e5e7eb", borderRadius: 8, height: 18, width: "100%", position: "relative" }}>
                      <div style={{
                        width: `${skill.percent}%`,
                        background: skill.color,
                        height: "100%",
                        borderRadius: 8,
                        transition: "width 0.8s"
                      }} />
                    </div>
                  </div>
                  <IconButton
                    size="small"
                    sx={{
                      color: "#e74c3c",
                      fontWeight: 900,
                      fontSize: 17,
                      ml: 1,
                    }}
                    onClick={() => handleSkillRemove(skill.label)}
                    aria-label="Delete Skill"
                  >
                    <FaTrash />
                  </IconButton>
                </div>
              ))}
              {/* Add new skill */}
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mt: 1 }}>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Skill name"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  sx={{ fontSize: 14, bgcolor: "#f5f6fa", borderRadius: 2, width: 120 }}
                />
                <TextField
                  variant="outlined"
                  size="small"
                  type="number"
                  placeholder="%"
                  value={newSkillPercent}
                  onChange={e => setNewSkillPercent(e.target.value)}
                  sx={{ width: 60, fontSize: 14, bgcolor: "#f5f6fa", borderRadius: 2 }}
                  inputProps={{ min: 1, max: 100 }}
                />
                <input
                  type="color"
                  value={newSkillColor}
                  onChange={e => setNewSkillColor(e.target.value)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    padding: 0,
                    marginRight: 6
                  }}
                  title="Pick Skill Bar Color"
                />
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: accentBlue,
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 15,
                    textTransform: "none",
                    px: 2.1,
                    boxShadow: "none",
                    minWidth: 0,
                    "&:hover": { bgcolor: "#0141A1" }
                  }}
                  onClick={handleSkillAdd}
                  startIcon={<FaPlus />}
                >
                  Add
                </Button>
              </Box>
              <div style={{ color: "#717171", fontSize: 13, marginTop: 7 }}>
                Add your own skill! Enter skill name, percent (1-100), pick a color, then click Add.
              </div>
            </div>

            {/* Ideas - Addable/Removable */}
            <div style={{
              background: "#fff",
              borderRadius: 28,
              boxShadow: "0 6px 24px rgba(37,99,235,0.08)",
              padding: "31px 40px"
            }}>
              <div style={{ color: mainBlue, fontWeight: 800, fontSize: 21, marginBottom: 15, display: "flex", alignItems: "center", gap: 10 }}>
                Supervisor's Ideas
                <FaLightbulb style={{ color: "#fbc73d", fontSize: 23 }} />
              </div>
              <ul style={{
                margin: "9px 0 0 0",
                paddingLeft: 0,
                listStyle: "none",
                maxWidth: 580
              }}>
                {ideas.map((idea, i) =>
                  <li
                    key={i}
                    style={{
                      color: accentBlue,
                      fontWeight: 650,
                      marginBottom: 6,
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      maxWidth: 520,
                      paddingRight: 15,
                    }}
                  >
                    <span style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      minWidth: 0
                    }}>
                      <FaLightbulb style={{ color: "#fbc73d", fontSize: 18 }} />
                      <span style={{
                        color: accentBlue,
                        fontWeight: 700,
                        fontSize: 16,
                        whiteSpace: "pre-line",
                        wordBreak: "break-word",
                        flex: 1,
                        minWidth: 0
                      }}>{idea}</span>
                    </span>
                    <IconButton
                      size="small"
                      sx={{
                        ml: 1,
                        color: "#e74c3c",
                        fontWeight: 900,
                        fontSize: 18,
                        padding: "2px 6px",
                        verticalAlign: "middle"
                      }}
                      onClick={() => handleRemoveIdea(idea)}
                      aria-label="Delete Idea"
                    >
                      <FaTrash />
                    </IconButton>
                  </li>
                )}
              </ul>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 18 }}>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Add new idea..."
                  value={newIdea}
                  onChange={e => setNewIdea(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAddIdea(); }}
                  sx={{
                    fontSize: 15,
                    bgcolor: "#f5f6fa",
                    borderRadius: 2,
                  }}
                />
                <Button
                  variant="contained"
                  size="medium"
                  sx={{
                    bgcolor: accentBlue,
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 16,
                    textTransform: "none",
                    px: 2.8,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#0141A1" }
                  }}
                  onClick={handleAddIdea}
                  startIcon={<FaPlusCircle />}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}