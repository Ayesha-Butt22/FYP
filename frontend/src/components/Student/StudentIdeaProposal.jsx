import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";
import DashboardSectionHeader from "../Student/DashboardSectionHeader";
import "./StudentIdeaProposal.css";

// Supervisors list with new ML supervisor added
const SUPERVISORS = [
  { name: "Dr. AI Expert", expertise: ["AI", "Machine Learning", "Deep Learning"] },
  { name: "Ms. Web Guru", expertise: ["React", "Node.js", "Web Development", "MERN", "MERN Stack"] },
  { name: "Mr. Data Wizard", expertise: ["Data Science", "Python", "Pandas"] },
  { name: "Ms. Cloud", expertise: ["AWS", "Azure", "Cloud"] },
  { name: "Dr. ML Specialist", expertise: ["Machine Learning", "ML", "Scikit-learn", "TensorFlow", "Deep Learning"] },
];

export default function StudentIdeaProposal() {
  const [title, setTitle] = useState("");
  const [aiTitleSuggestions, setAiTitleSuggestions] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tools, setTools] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [supervisorDialog, setSupervisorDialog] = useState(false);
  const [matchedSupervisors, setMatchedSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [statusDialog, setStatusDialog] = useState(false);
  const [supervisorStatus, setSupervisorStatus] = useState("");
  const [supervisorSuggestion, setSupervisorSuggestion] = useState("");

  // AI Project Title Suggestion only
  const handleSuggestTitle = () => {
    if (!title) return;
    setAiTitleSuggestions([
      title + " System",
      "Automated " + title.charAt(0).toUpperCase() + title.slice(1),
    ]);
    setSelectedTitle("");
  };

  const handleSelectTitle = (t) => {
    setSelectedTitle(t);
    setTitle(t);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleOpenSupervisorDialog = () => {
    const techArr = tools
      .split(/[\s,;]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    let matches = SUPERVISORS.filter((sup) =>
      sup.expertise.some((exp) =>
        techArr.some(
          (tool) =>
            exp.toLowerCase().includes(tool) || tool.includes(exp.toLowerCase())
        )
      )
    );

    if (matches.length === 0) matches = SUPERVISORS;

    setMatchedSupervisors(matches);
    setSupervisorDialog(true);
  };

  const handleSendSupervisorRequest = (name) => {
    setSelectedSupervisor(name);
    setSupervisorDialog(false);
    setSupervisorStatus("pending");
    setStatusDialog(true);

    setTimeout(() => {
      if (name === "Dr. AI Expert" || name === "Dr. ML Specialist") {
        setSupervisorStatus("approved");
        setSupervisorSuggestion("");
      } else {
        setSupervisorStatus("rejected");
        setSupervisorSuggestion(
          "Your topic does not match my current research interests. Please clarify the use of specific technology in your project."
        );
      }
    }, 1800);
  };

  const handleEditProposal = () => {
    setSubmitted(false);
    setSelectedSupervisor("");
    setSupervisorStatus("");
    setSupervisorSuggestion("");
    setStatusDialog(false);
  };

  return (
    <>
      <DashboardSectionHeader>Idea & Proposal</DashboardSectionHeader>

      <div className="section-desc">
        Here you can create your FYP group, propose your project, and add your
        team members. Get AI suggestions for your project title. Once submitted,
        you can select a supervisor and proceed with your FYP process.
      </div>

      <Box className="idea-proposal-container">
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <Stack gap={3}>
              {/* Project Title with AI Rewrite */}
              <Box>
                <TextField
                  label="Project Title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setAiTitleSuggestions([]);
                    setSelectedTitle("");
                  }}
                  fullWidth
                  className="input"
                />
                <Button
                  variant="contained"
                  className="ai-btn"
                  onClick={handleSuggestTitle}
                  disabled={!title}
                  type="button"
                >
                  Rewrite with AI
                </Button>
                {aiTitleSuggestions.length > 0 && (
                  <Box className="ai-suggestions">
                    <Typography className="ai-suggestions-title">
                      AI Suggestions:
                    </Typography>
                    <Stack direction="row" spacing={2} className="ai-chip-stack">
                      {aiTitleSuggestions.map((sug) => (
                        <Chip
                          key={sug}
                          label={sug}
                          color={selectedTitle === sug ? "primary" : "default"}
                          className="ai-chip"
                          onClick={() => handleSelectTitle(sug)}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>

              <Box>
                <TextField
                  label="Project Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                  className="input"
                />
              </Box>

              <Box>
                <TextField
                  label="Tools / Technologies"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  fullWidth
                  className="input"
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="secondary"
                className="submit-btn"
                disabled={!selectedTitle && !title}
              >
                Select Supervisor
              </Button>
            </Stack>
          </form>
        ) : (
          <Box textAlign="center" className="after-submit">
            <Button
              variant="contained"
              color="secondary"
              className="select-supervisor-btn"
              onClick={handleOpenSupervisorDialog}
            >
              Select Supervisor
            </Button>
          </Box>
        )}
      </Box>

      {/* Supervisor Selection Dialog */}
      <Dialog open={supervisorDialog} onClose={() => setSupervisorDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Supervisor</DialogTitle>
        <DialogContent>
          {matchedSupervisors.length === 0 ? (
            <Alert severity="info">
              No supervisors found matching your technologies. Please review your tools/technologies.
            </Alert>
          ) : (
            <List>
              {matchedSupervisors.map((sup) => (
                <ListItem key={sup.name} button onClick={() => handleSendSupervisorRequest(sup.name)}>
                  <ListItemText
                    primary={sup.name}
                    secondary={"Expertise: " + sup.expertise.join(", ")}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSupervisorDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {supervisorStatus === "pending"
            ? "Request Sent"
            : supervisorStatus === "approved"
            ? "Approved"
            : supervisorStatus === "rejected"
            ? "Rejected"
            : ""}
        </DialogTitle>
        <DialogContent>
          {supervisorStatus === "pending" && (
            <Typography>
              Your request to <b>{selectedSupervisor}</b> has been sent. Waiting for supervisor approval...
            </Typography>
          )}
          {supervisorStatus === "approved" && (
            <Typography className="approved-text">
              Your supervisor <b>{selectedSupervisor}</b> has approved your request.
              <br />
              You will be able to upload documents after approval.
            </Typography>
          )}
          {supervisorStatus === "rejected" && (
            <>
              <Alert severity="error" className="reject-alert">
                Your proposal was rejected by {selectedSupervisor}.
              </Alert>
              <Typography className="reject-reason-label">Reason / Suggestion:</Typography>
              <Typography className="reject-reason">{supervisorSuggestion}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {supervisorStatus === "rejected" ? (
            <Button onClick={handleEditProposal}>Edit Proposal & Resubmit</Button>
          ) : (
            <Button onClick={() => setStatusDialog(false)}>Close</Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
