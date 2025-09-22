import React, { useState } from "react";
import {
  FaUserTie,
  FaEnvelope,
  FaLightbulb,
  FaPlusCircle,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import DashboardSectionHeader from "../../components/Supervisor/DashboardSectionHeader";
import { Chip, TextField, Button, IconButton, Box, Modal, Typography } from "@mui/material";

export default function SupervisorProfile({ supervisorInfo }) {
  // State
  const [skills, setSkills] = useState([
    { label: "Python", color: "#2563eb", percent: 90 },
    { label: "React", color: "#fbc73d", percent: 85 },
    { label: "AI/ML", color: "#16a34a", percent: 95 },
    { label: "Node.js", color: "#f43f5e", percent: 70 },
  ]);
  const [newSkill, setNewSkill] = useState("");
  const [newSkillPercent, setNewSkillPercent] = useState("");
  const [newSkillColor, setNewSkillColor] = useState("#2563eb");
  const [skillModalOpen, setSkillModalOpen] = useState(false);

  const expertiseTags = ["AI", "ML", "Web"];
  const [ideas, setIdeas] = useState([
    "AI-Based Disease Prediction",
    "Smart Attendance System",
    "Online Exam Proctoring",
  ]);
  const [newIdea, setNewIdea] = useState("");

  const mainBlue = "#01337a";
  const accentBlue = "#2563eb";

  // Handlers
  const handleSkillAdd = () => {
    const trimmed = newSkill.trim();
    const percent = parseInt(newSkillPercent, 10);
    if (
      trimmed &&
      !skills.some((s) => s.label.toLowerCase() === trimmed.toLowerCase()) &&
      !isNaN(percent) &&
      percent >= 1 &&
      percent <= 100
    ) {
      setSkills([...skills, { label: trimmed, color: newSkillColor, percent }]);
      setNewSkill("");
      setNewSkillPercent("");
      setNewSkillColor("#2563eb");
      setSkillModalOpen(false);
    }
  };
  const handleSkillRemove = (label) =>
    setSkills(skills.filter((s) => s.label !== label));

  const handleAddIdea = () => {
    const trimmed = newIdea.trim();
    if (trimmed && !ideas.includes(trimmed)) {
      setIdeas([...ideas, trimmed]);
      setNewIdea("");
    }
  };
  const handleRemoveIdea = (idea) =>
    setIdeas(ideas.filter((i) => i !== idea));

  // Layout constants
  const BOX_SIZE = 440;
  const CARD_BG = "#fff";
  const CARD_RADIUS = 38;
  const CARD_SHADOW = "0 8px 48px rgba(37,99,235,0.13)";
  const CARD_PADDING = "56px 44px 54px 44px";
  const SKILL_BAR_MAX_WIDTH = 340;
  const SKILL_LIST_HEIGHT = 220;

  return (
    <Box>
      <DashboardSectionHeader>Profile</DashboardSectionHeader>
      <div
        style={{
          display: "flex",
          gap: 34,
          alignItems: "flex-end",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {/* Profile */}
        <div
          style={{
            width: BOX_SIZE,
            height: BOX_SIZE,
            background: CARD_BG,
            borderRadius: CARD_RADIUS,
            boxShadow: CARD_SHADOW,
            padding: CARD_PADDING,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ width: "100%" }}>
            <div
              style={{
                background: "#2563eb22",
                borderRadius: "50%",
                width: 110,
                height: 110,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px auto",
                boxShadow: "0 6px 32px rgba(37,99,235,0.13)",
              }}
            >
              <FaUserTie size={70} color={accentBlue} />
            </div>
            <div
              style={{
                fontWeight: 900,
                color: mainBlue,
                fontSize: 32,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {supervisorInfo?.name || "Supervisor"}
            </div>
            <div
              style={{
                fontWeight: 700,
                color: accentBlue,
                fontSize: 20,
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              {supervisorInfo?.subtitle || "AI, ML, Software Engineering"}
            </div>
            <div
              style={{
                fontSize: 17,
                color: "#444",
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 9,
                justifyContent: "center",
                wordBreak: "break-all",
                marginBottom: 0,
              }}
            >
              <FaEnvelope style={{ color: accentBlue }} />{" "}
              {supervisorInfo?.email || "ayesha@riphah.edu.pk"}
            </div>
          </div>
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 14,
              marginTop: 30,
              padding: "13px 12px 11px 12px",
              width: "100%",
              textAlign: "left",
              boxShadow: "0 2px 10px rgba(37,99,235,0.05)",
            }}
          >
            <div
              style={{
                color: "#222",
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 7,
                letterSpacing: 0.5,
              }}
            >
              Expertise Tags
            </div>
            <div>
              {expertiseTags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    background: "#2563eb11",
                    color: accentBlue,
                    fontWeight: 800,
                    borderRadius: 8,
                    padding: "4px 16px",
                    fontSize: 14,
                    marginRight: 8,
                    marginBottom: 5,
                    display: "inline-block",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div
          style={{
            width: BOX_SIZE,
            height: BOX_SIZE,
            background: CARD_BG,
            borderRadius: CARD_RADIUS,
            boxShadow: CARD_SHADOW,
            padding: CARD_PADDING,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              color: mainBlue,
              fontWeight: 900,
              fontSize: 25,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 13,
            }}
          >
            My Current Skill
            <Chip
              size="small"
              label="Top Skills"
              sx={{
                background: "#2563eb11",
                color: accentBlue,
                fontWeight: 900,
                fontSize: 15,
                ml: 1,
                letterSpacing: 0.5,
              }}
            />
            <IconButton
              onClick={() => setSkillModalOpen(true)}
              sx={{
                bgcolor: accentBlue,
                color: "#fff",
                ml: 2,
                fontWeight: 900,
                fontSize: 18,
                borderRadius: "6px",
                boxShadow: "0 2px 12px rgba(37,99,235,0.13)",
                "&:hover": { bgcolor: "#0141A1" },
              }}
              aria-label="Add Skill"
            >
              <FaPlus />
            </IconButton>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              maxHeight: SKILL_LIST_HEIGHT,
              paddingRight: 8,
              marginBottom: 6,
            }}
          >
            {skills.map((skill) => (
              <div
                key={skill.label}
                style={{
                  marginBottom: 22,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div style={{ flex: 1, maxWidth: SKILL_BAR_MAX_WIDTH }}>
                  <div
                    style={{
                      fontWeight: 800,
                      color: accentBlue,
                      fontSize: 17,
                      marginBottom: 7,
                    }}
                  >
                    {skill.label}
                  </div>
                  <div
                    style={{
                      background: "#e5e7eb",
                      borderRadius: 8,
                      height: 18,
                      width: "100%",
                      position: "relative",
                      minWidth: 120,
                    }}
                  >
                    <div
                      style={{
                        width: `${skill.percent}%`,
                        background: skill.color,
                        height: "100%",
                        borderRadius: 8,
                        transition: "width 0.8s",
                      }}
                    />
                  </div>
                </div>
                <IconButton
                  size="medium"
                  sx={{
                    color: "#e74c3c",
                    fontWeight: 900,
                    fontSize: 19,
                    ml: 1,
                  }}
                  onClick={() => handleSkillRemove(skill.label)}
                  aria-label="Delete Skill"
                >
                  <FaTrash />
                </IconButton>
              </div>
            ))}
          </div>

          {/* Modal for add skill */}
          <Modal
            open={skillModalOpen}
            onClose={() => setSkillModalOpen(false)}
            aria-labelledby="add-skill-modal-title"
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 360,
                bgcolor: "background.paper",
                borderRadius: 4,
                boxShadow: 24,
                p: 4,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                alignItems: "center",
              }}
            >
              <Typography
                id="add-skill-modal-title"
                variant="h6"
                sx={{ fontWeight: 800, color: mainBlue, mb: 1 }}
              >
                Add Skill
              </Typography>
              <TextField
                variant="outlined"
                size="medium"
                placeholder="Skill name"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                sx={{
                  fontSize: 16,
                  bgcolor: "#f5f6fa",
                  borderRadius: 2,
                  width: "90%",
                }}
              />
              <TextField
                variant="outlined"
                size="medium"
                type="number"
                placeholder="%"
                value={newSkillPercent}
                onChange={(e) => setNewSkillPercent(e.target.value)}
                sx={{
                  width: "90%",
                  fontSize: 16,
                  bgcolor: "#f5f6fa",
                  borderRadius: 2,
                }}
                inputProps={{ min: 1, max: 100 }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "90%",
                }}
              >
                <span style={{ fontWeight: 700, color: "#555" }}>Bar Color:</span>
                <input
                  type="color"
                  value={newSkillColor}
                  onChange={(e) => setNewSkillColor(e.target.value)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 4,
                    border: "1.3px solid #e5e7eb",
                    background: "#fff",
                  }}
                />
              </Box>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: accentBlue,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 18,
                  textTransform: "none",
                  px: 3.2,
                  "&:hover": { bgcolor: "#0141A1" },
                  mt: 2,
                }}
                onClick={handleSkillAdd}
                startIcon={<FaPlus />}
                fullWidth
              >
                Add Skill
              </Button>
            </Box>
          </Modal>
          <div style={{ color: "#717171", fontSize: 14, marginTop: 8 }}>
            Add your own skill! Click{" "}
            <span style={{ fontWeight: 700, color: accentBlue }}>+</span> to add
            new skill and percentage.
          </div>
        </div>

        {/* Ideas */}
        <div
          style={{
            width: BOX_SIZE,
            height: BOX_SIZE,
            background: CARD_BG,
            borderRadius: CARD_RADIUS,
            boxShadow: CARD_SHADOW,
            padding: CARD_PADDING,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ width: "100%" }}>
            <div
              style={{
                color: mainBlue,
                fontWeight: 900,
                fontSize: 23,
                marginBottom: 15,
                display: "flex",
                alignItems: "center",
                gap: 11,
              }}
            >
              Supervisor's Ideas
              <FaLightbulb style={{ color: "#fbc73d", fontSize: 23 }} />
            </div>
            <ul
              style={{
                margin: "13px 0 0 0",
                paddingLeft: 0,
                listStyle: "none",
                maxWidth: 340,
                marginBottom: 28,
              }}
            >
              {ideas.map((idea, i) => (
                <li
                  key={i}
                  style={{
                    color: accentBlue,
                    fontWeight: 650,
                    marginBottom: 15,
                    fontSize: 17,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    maxWidth: 330,
                    paddingRight: 8,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <FaLightbulb style={{ color: "#fbc73d", fontSize: 19 }} />
                    <span
                      style={{
                        color: accentBlue,
                        fontWeight: 700,
                        fontSize: 17,
                        wordBreak: "break-word",
                        flex: 1,
                      }}
                    >
                      {idea}
                    </span>
                  </span>
                  <IconButton
                    size="medium"
                    sx={{
                      ml: 1,
                      color: "#e74c3c",
                      fontWeight: 900,
                      fontSize: 19,
                    }}
                    onClick={() => handleRemoveIdea(idea)}
                    aria-label="Delete Idea"
                  >
                    <FaTrash />
                  </IconButton>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Add new idea..."
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddIdea();
              }}
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
                "&:hover": { bgcolor: "#0141A1" },
              }}
              onClick={handleAddIdea}
              startIcon={<FaPlusCircle />}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </Box>
  );
}
