import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  useMediaQuery,
  Stack,
} from "@mui/material";
import { toastService } from "../ToastService/ToastService";
import ToastContainer from "../ToastService/ToastContainer";
import DashboardSectionHeader from "../Student/DashboardSectionHeader"; 
import "./StudentGroup.css";

// Demo: Map SAPID to Student Name (simulate a database)
const sapidToName = {
  "48288": "Ayesha Butt",
  "12345": "Ali Raza",
  "67890": "Sara Khan",
};

const getName = (sapid) => sapidToName[sapid] || "Name not found";
const sapidToEmail = (sapid) =>
  sapid ? `${sapid}@students.riphah.edu.pk` : "";

const CURRENT_USER_SAPID = "48288"; // Simulate logged in user SAPID

export default function StudentGroup() {
  const [group, setGroup] = useState(() => {
    const g = localStorage.getItem("fyp_groupdata");
    if (g) {
      const parsed = JSON.parse(g);
      if (parsed.members.some((m) => m.sapid === CURRENT_USER_SAPID)) {
        return parsed;
      }
    }
    return null;
  });

  const isMobile = useMediaQuery("(max-width:900px)");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); 
  const [numMembers, setNumMembers] = useState(1);
  const [members, setMembers] = useState([
    {
      sapid: CURRENT_USER_SAPID,
      email: sapidToEmail(CURRENT_USER_SAPID),
      isLeader: true,
    },
    { sapid: "", email: "", isLeader: false },
    { sapid: "", email: "", isLeader: false },
  ]);
  const [error, setError] = useState("");

  const handleNumMembersSubmit = (e) => {
    e.preventDefault();
    if (numMembers < 1 || numMembers > 3) {
      setError("Members must be between 1 and 3.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleMemberChange = (i, value) => {
    const newMembers = [...members];
    newMembers[i].sapid = value;
    newMembers[i].email = sapidToEmail(value);
    setMembers(newMembers);
  };

  const handleCreateGroup = () => {
    setError("");
    for (let i = 0; i < numMembers; ++i) {
      if (!members[i].sapid) {
        setError("All SAP IDs must be filled.");
        return;
      }
    }
    const groupObj = {
      members: members.slice(0, numMembers).map((m, i) => ({
        ...m,
        isLeader: i === 0,
      })),
      leader: members[0],
    };
    localStorage.setItem("fyp_groupdata", JSON.stringify(groupObj));
    setGroup(groupObj);
    setOpen(false);
    setStep(1);
    toastService.success("Group created successfully!");
  };

  const handleDeleteGroup = () => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      localStorage.removeItem("fyp_groupdata");
      setGroup(null);
      setMembers([
        {
          sapid: CURRENT_USER_SAPID,
          email: sapidToEmail(CURRENT_USER_SAPID),
          isLeader: true,
        },
        { sapid: "", email: "", isLeader: false },
        { sapid: "", email: "", isLeader: false },
      ]);
      toastService.success("Group deleted!");
    }
  };

  return (
    <Box className="page-container">
      <ToastContainer />
      <DashboardSectionHeader>My Group</DashboardSectionHeader>
      <div className="section-desc">
        Here you can create your FYP group and add your team members. Once your group is created, you can view all team members and their details here.
      </div>

      {/* CREATE GROUP BUTTON */}
      {!group && (
        <Box className="create-group-btn-wrap">
          <Button
            variant="contained"
            size="large"
            onClick={() => setOpen(true)}
            className="create-group-btn"
            startIcon={<AddIcon sx={{ fontSize: isMobile ? 25 : 35 }} />}
          >
            CREATE GROUP
          </Button>
        </Box>
      )}

      {/* GROUP TABLE */}
      {group && (
        <Box className="table-outer-wrap">
          <Box className="group-card">
            <Typography className="group-title">Group Members</Typography>
            <TableContainer component={Paper} className="mui-table-container">
              <Table className="mui-table">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" className="mui-table-head">Role</TableCell>
                    <TableCell align="center" className="mui-table-head">Name</TableCell>
                    <TableCell align="center" className="mui-table-head">SAP ID</TableCell>
                    <TableCell align="center" className="mui-table-head">Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.members.map((m, idx) => (
                    <TableRow key={idx}>
                      <TableCell align="center" className="mui-table-bodycell">{m.isLeader ? "Leader" : `Member ${idx + 1}`}</TableCell>
                      <TableCell align="center" className="mui-table-bodycell">{getName(m.sapid)}</TableCell>
                      <TableCell align="center" className="mui-table-bodycell">{m.sapid}</TableCell>
                      <TableCell align="center" className="mui-table-bodycell">{m.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {group.leader.sapid === CURRENT_USER_SAPID && (
              <Box className="delete-btn-wrap">
                <Button
                  color="error"
                  variant="contained"
                  className="delete-group-btn"
                  onClick={handleDeleteGroup}
                >
                  DELETE GROUP
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* GROUP CREATION DIALOG */}
      <Dialog
        open={open}
        onClose={() => { setOpen(false); setStep(1); }}
        PaperProps={{ className: "dialog-paper" }}
      >
        <DialogTitle className="dialog-title">
          {step === 1 ? "Enter Number of Group Members" : "Enter Member Details"}
        </DialogTitle>
        <DialogContent>
          {step === 1 && (
            <form onSubmit={handleNumMembersSubmit}>
              <TextField
                label="Number of Members (1-3)"
                type="number"
                fullWidth
                autoFocus
                value={numMembers}
                onChange={e => setNumMembers(Math.max(1, Math.min(3, Number(e.target.value) || 1)))}
                inputProps={{ min: 1, max: 3, step: 1 }}
                className="num-members-input"
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained" fullWidth className="next-btn">
                NEXT
              </Button>
            </form>
          )}

          {step === 2 && (
            <Stack spacing={3} className="member-list">
              {[...Array(numMembers)].map((_, i) => (
                <Box key={i} className="member-card">
                  <Typography className="member-label">
                    {i === 0 ? "Leader" : `Member ${i + 1}`}
                  </Typography>
                  <Box className="member-fields">
                    <TextField
                      label="SAP ID"
                      value={members[i].sapid}
                      onChange={e => handleMemberChange(i, e.target.value)}
                      fullWidth
                      disabled={i === 0}
                      className="member-input"
                    />
                    <TextField
                      label="Email"
                      value={members[i].email}
                      disabled
                      fullWidth
                      className="member-input"
                    />
                  </Box>
                </Box>
              ))}
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {step === 2 && (
            <Button onClick={handleCreateGroup} variant="contained" className="create-btn">
              CREATE GROUP
            </Button>
          )}
          <Button onClick={() => { setOpen(false); setStep(1); }} className="cancel-btn">
            CANCEL
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
