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
import { studentGroupApi } from "../Api/StudentApi/StudentGroupApi";

const sapidToName = {
  "48288": "Ayesha Butt",
  "12345": "Ali Raza",
  "67890": "Sara Khan",
};

const getName = (sapid) => sapidToName[sapid] || "Name not found";
const sapidToEmail = (sapid) => sapid ? `${sapid}@students.riphah.edu.pk` : "";
const CURRENT_USER_SAPID = "48288"; // Simulate logged in user SAPID

export default function StudentGroup() {
  const [group, setGroup] = useState(null);
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

  // Generate a unique groupId (could use uuid library in production)
  const generateGroupId = () => `group-${Date.now()}`;

  const handleCreateGroup = async () => {
    setError("");
    for (let i = 0; i < numMembers; ++i) {
      if (!members[i].sapid) {
        setError("All SAP IDs must be filled.");
        return;
      }
    }

    const groupObj = {
      groupId: generateGroupId(),
      leader: {
        sapId: members[0].sapid,
        email: members[0].email,
      },
      member2: numMembers > 1 ? {
        sapId: members[1].sapid,
        email: members[1].email,
      } : undefined,
      member3: numMembers > 2 ? {
        sapId: members[2].sapid,
        email: members[2].email,
      } : undefined,
    };

    try {
      const res = await studentGroupApi.createGroup(groupObj);
      if (res && res.group) {
        setGroup({
          members: [
            { ...groupObj.leader, isLeader: true },
            ...(groupObj.member2?.sapId ? [{ ...groupObj.member2, isLeader: false }] : []),
            ...(groupObj.member3?.sapId ? [{ ...groupObj.member3, isLeader: false }] : []),
          ],
          leader: groupObj.leader,
          _id: res.group._id,
        });
        setOpen(false);
        setStep(1);
        toastService.success("Group created successfully!");
      } else {
        setError(res?.error || "Failed to create group.");
      }
    } catch (err) {
      setError("Server error. Try again.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !group._id) return;
    if (window.confirm("Are you sure you want to delete this group?")) {
      const res = await studentGroupApi.deleteGroup(group._id);
      if (res && res.message) {
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
      } else {
        toastService.error(res?.error || "Failed to delete group.");
      }
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
                      <TableCell align="center" className="mui-table-bodycell">{getName(m.sapId)}</TableCell>
                      <TableCell align="center" className="mui-table-bodycell">{m.sapId}</TableCell>
                      <TableCell align="center" className="mui-table-bodycell">{m.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {group.leader.sapId === CURRENT_USER_SAPID && (
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