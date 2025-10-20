import React, { useState, useEffect } from "react";
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
  Alert,
  useMediaQuery,
  Stack,
  CircularProgress
} from "@mui/material";
import { toastService } from "../ToastService/ToastService";
import DashboardSectionHeader from "../Student/DashboardSectionHeader";
import "./StudentGroup.css";
import { studentGroupApi } from "../Api/StudentApi/StudentGroupApi";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import AppTable from "../Admin/AppTable.jsx";

const sapidToEmail = (sapid) => sapid ? `${sapid}@students.riphah.edu.pk` : "";

export default function StudentGroup() {
  const [CURRENT_USER_SAPID, setCURRENT_USER_SAPID] = useState(localStorage.getItem("studentId") || "");
  const [CURRENT_USER_EMAIL, setCURRENT_USER_EMAIL] = useState(localStorage.getItem("email") || "");
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width:900px)");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [groupChanged, setGroupChanged] = useState(0);

  const [numMembers, setNumMembers] = useState("1");
  const [members, setMembers] = useState([
    { sapid: CURRENT_USER_SAPID, email: sapidToEmail(CURRENT_USER_SAPID), isLeader: true },
    { sapid: "", email: "", isLeader: false },
    { sapid: "", email: "", isLeader: false },
  ]);
  const [error, setError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const email = localStorage.getItem("email") || "";
      if (email !== CURRENT_USER_EMAIL) setCURRENT_USER_EMAIL(email);
      const sapid = localStorage.getItem("studentId") || "";
      if (sapid !== CURRENT_USER_SAPID) setCURRENT_USER_SAPID(sapid);
    }, 1000);
    return () => clearInterval(interval);
  }, [CURRENT_USER_EMAIL, CURRENT_USER_SAPID]);

  useEffect(() => {
    const checkGroup = async () => {
      setLoading(true);
      try {
        const res = await studentGroupApi.getGroupByEmail(CURRENT_USER_EMAIL);
        if (res && res.groupId) {
          setGroup({
            groupId: res.groupId,
            members: [
              { ...res.leader, isLeader: true },
              ...(res.member2?.sapId ? [{ ...res.member2, isLeader: false }] : []),
              ...(res.member3?.sapId ? [{ ...res.member3, isLeader: false }] : []),
            ],
            leader: res.leader,
            _id: res._id,
          });
        } else {
          setGroup(null);
        }
      } catch (err) {
        setGroup(null);
      } finally {
        setLoading(false);
      }
    };
    if (CURRENT_USER_EMAIL) checkGroup();
  }, [CURRENT_USER_EMAIL, CURRENT_USER_SAPID, groupChanged]);

  const handleNumMembersSubmit = (e) => {
    e.preventDefault();
    const num = Math.max(1, Math.min(3, Number(numMembers) || 1));
    if (num < 1 || num > 3) {
      setError("Members must be between 1 and 3.");
      toastService.error("Members must be between 1 and 3.");
      return;
    }
    setError("");
    setStep(2);
    setNumMembers(num.toString());
  };

  const handleMemberChange = (i, value) => {
    const newMembers = [...members];
    newMembers[i].sapid = value;
    newMembers[i].email = sapidToEmail(value);
    setMembers(newMembers);
  };

  const generateGroupId = () => `group-${Date.now()}`;

  const handleCreateGroup = async () => {
    setError("");
    const num = Math.max(1, Math.min(3, Number(numMembers) || 1));
    for (let i = 0; i < num; ++i) {
      if (!members[i].sapid && i !== 0) {
        setError("All SAP IDs must be filled.");
        toastService.error("All SAP IDs must be filled.");
        return;
      }
    }
    const groupObj = {
      groupId: generateGroupId(),
      leader: { sapId: members[0].sapid, email: CURRENT_USER_EMAIL },
      member2: num > 1 ? { sapId: members[1].sapid, email: members[1].email } : undefined,
      member3: num > 2 ? { sapId: members[2].sapid, email: members[2].email } : undefined,
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
        setGroupChanged(c => c + 1);
        toastService.success("Group created successfully!");
      } else {
        setError(res?.error || "Failed to create group.");
        toastService.error(res?.error || "Failed to create group.");
      }
    } catch (err) {
      setError("Server error. Try again.");
      toastService.error("Server error. Try again.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !group._id) return;
    const confirmed = await Confirm("Are you sure you want to delete this group?");
    if (confirmed) {
      const res = await studentGroupApi.deleteGroup(group._id);
      if (res && res.message) {
        setGroup(null);
        setMembers([
          { sapid: CURRENT_USER_SAPID, email: sapidToEmail(CURRENT_USER_SAPID), isLeader: true },
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
    <Box className="studentgroup-page-container">
      <DashboardSectionHeader
        description="Here you can create your FYP group and add your team members. Once your group is created, you can view all team members and their details here."
      >
        My Group
      </DashboardSectionHeader>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !group && (
        <Box className="studentgroup-create-group-btn-wrap">
          <Button
            variant="contained"
            size="large"
            onClick={() => setOpen(true)}
            className="studentgroup-create-group-btn"
            startIcon={<AddIcon sx={{ fontSize: isMobile ? 25 : 35 }} />}
          >
            CREATE GROUP
          </Button>
        </Box>
      )}

      {!loading && group && (
        <Box className="studentgroup-table-outer-wrap">
          <Box className="studentgroup-group-card">
            <Typography className="studentgroup-group-title">Group Members</Typography>
            <Typography variant="subtitle1">{group.groupId}</Typography>
            <AppTable
              headers={["Role", "Name", "SAP ID", "Email"]}
              rows={group.members.map((m, idx) => ({
                Role: m.isLeader ? "Leader" : `Member ${idx}`,
                Name: m.name || "N/A",
                "SAP ID": m.sapId,
                Email: m.email,
              }))}
            />

            {group.leader.email === CURRENT_USER_EMAIL && (
              <Box className="studentgroup-delete-btn-wrap">
                <Button
                  color="error"
                  variant="contained"
                  className="studentgroup-delete-group-btn"
                  onClick={handleDeleteGroup}
                >
                  DELETE GROUP
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Dialog
        open={open}
        onClose={() => { setOpen(false); setStep(1); }}
        PaperProps={{ className: "studentgroup-dialog-paper" }}
      >
        <DialogTitle className="studentgroup-dialog-title">
          {step === 1 ? "Enter Number of Group Members" : "Enter Member Details"}
        </DialogTitle>
        <DialogContent>
          {step === 1 && (
            <form onSubmit={handleNumMembersSubmit}>
              <TextField
                label="Number of Members (1-3)"
                type="number"
                inputMode="numeric"
                fullWidth
                autoFocus
                value={numMembers}
                onChange={e => setNumMembers(e.target.value)}
                inputProps={{ min: 1, max: 3, step: 1, pattern: "\\d*", style: { MozAppearance: 'textfield' } }}
                className="studentgroup-num-members-input"
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained" fullWidth className="studentgroup-next-btn">
                NEXT
              </Button>
            </form>
          )}

          {step === 2 && (
            <Stack spacing={3} className="studentgroup-member-list">
              {[...Array(Math.max(1, Math.min(3, Number(numMembers) || 1)))].map((_, i) => (
                <Box key={i} className="studentgroup-member-card">
                  <Typography className="studentgroup-member-label">
                    {i === 0 ? "Leader" : `Member ${i + 1}`}
                  </Typography>
                  <Box className="studentgroup-member-fields">
                    <TextField
                      label="SAP ID"
                      value={members[i].sapid}
                      onChange={e => handleMemberChange(i, e.target.value)}
                      fullWidth
                      disabled={i === 0}
                      className="studentgroup-member-input"
                    />
                    <TextField
                      label="Email"
                      value={i === 0 ? CURRENT_USER_EMAIL : members[i].email}
                      disabled
                      fullWidth
                      className="studentgroup-member-input"
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
            <Button onClick={handleCreateGroup} variant="contained" className="studentgroup-create-btn">
              CREATE GROUP
            </Button>
          )}
          <Button onClick={() => { setOpen(false); setStep(1); }} className="studentgroup-cancel-btn">
            CANCEL
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
