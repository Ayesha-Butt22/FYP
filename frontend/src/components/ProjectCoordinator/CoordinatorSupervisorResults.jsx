import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toastService } from "../ToastService/ToastService.jsx";
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Stack,
  CircularProgress,
  Chip,
  IconButton,
  Modal,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  CheckCircle,
  AccountCircle
} from "@mui/icons-material";
import DashboardSectionHeader from "./DashboardSectionHeader";
import AppTable from "./AppTable.jsx";
import "./CommitteeResults.css";

const maskGroupId = (originalId) => {
  if (!originalId) return 'group-00000';
  const str = String(originalId);
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    return `Group-${str.slice(-5).toUpperCase()}`;
  }
  return str;
};

export default function CoordinatorSupervisorResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEval, setSelectedEval] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/coordinator/final-results`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setResults(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toastService.error("Failed to fetch results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handlePublish = async (supEvalId) => {
    if (!supEvalId) {
      toastService.error("No supervisor evaluation found to publish.");
      return;
    }
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/coordinator/publish-supervisor-result`, { id: supEvalId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        toastService.success("Supervisor evaluation published successfully!");
        setResults(prev => prev.map(r => r.supEvalId === supEvalId ? { ...r, isSupPublished: true } : r));
      }
    } catch (err) {
      console.error(err);
      toastService.error(err.response?.data?.message || "Failed to publish.");
    }
  };

  const groupedResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    
    // 1. Filter raw results
    const baseResults = results.filter(r => r.supEvalId);
    
    // 2. Group by supEvalId
    const groups = {};
    baseResults.forEach(r => {
      if (!groups[r.supEvalId]) {
        groups[r.supEvalId] = {
          supEvalId: r.supEvalId,
          groupId: r.groupId,
          year: r.year,
          supervisorName: r.supervisorName,
          isSupPublished: r.isSupPublished,
          supervisorEvaluations: r.supervisorEvaluations || [],
          students: []
        };
      }
      groups[r.supEvalId].students.push({
        studentName: r.studentName,
        sapId: r.sapId,
        marks: r.supervisorMarks,
        remarks: r.remarks,
        supervisorRemarks: r.supervisorRemarks
      });
    });

    // 3. Apply search filter on grouped data
    return Object.values(groups).filter(g => 
      String(g.groupId).toLowerCase().includes(term) ||
      maskGroupId(g.groupId).toLowerCase().includes(term) ||
      String(g.supervisorName).toLowerCase().includes(term) ||
      g.students.some(s => 
        String(s.studentName).toLowerCase().includes(term) || 
        String(s.sapId).toLowerCase().includes(term)
      )
    );
  }, [results, searchTerm]);

  const tableRows = groupedResults.map(g => ({
    "Group ID": <span className="cor-week-badge">{maskGroupId(g.groupId)}</span>,
    "Year": <Chip label={g.year} size="small" sx={{ fontWeight: 800, bgcolor: '#01337a', color: 'white' }} />,
    "Supervisor": <Typography fontWeight={700} color="#1e293b">{g.supervisorName}</Typography>,
    "Status": (
      <Chip 
        label={g.isSupPublished ? "Published" : "Pending"} 
        size="small" 
        color={g.isSupPublished ? "success" : "warning"}
        sx={{ fontWeight: 700 }}
      />
    ),
    "Details": (
      <IconButton 
        color="primary" 
        onClick={() => {
          setSelectedEval(g);
          setModalOpen(true);
        }}
        size="small"
      >
        <VisibilityIcon />
      </IconButton>
    ),
    "Action": (
      <Button
        variant="contained"
        size="small"
        onClick={() => handlePublish(g.supEvalId)}
        disabled={g.isSupPublished || !g.supEvalId}
        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: g.isSupPublished ? '#94a3b8' : '#01337a' }}
      >
        {g.isSupPublished ? "Published" : "Publish"}
      </Button>
    ),
    __raw: g
  }));

  if (loading && results.length === 0) return <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <div className="cor-committee-container">
      <DashboardSectionHeader description="Manage and publish supervisor evaluations. Students can only see their supervisor's marks once published by the coordinator.">
        Supervisor Results Management
      </DashboardSectionHeader>

      <Paper className="cor-committee-paper" sx={{ borderRadius: 6, mt: 3 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
          <TextField
            size="small"
            placeholder="Search groups, supervisors, students..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            sx={{ width: 350, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment> }}
          />
        </Box>

        {tableRows.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center', color: '#94a3b8' }}>
            <Typography variant="h6" fontWeight={700}>No supervisor evaluations found.</Typography>
          </Box>
        ) : (
          <AppTable 
            headers={["Group ID", "Year", "Supervisor", "Status", "Details", "Action"]} 
            rows={tableRows} 
          />
        )}
      </Paper>

      {/* DETAILED INFO MODAL */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '95%', md: 800 }, bgcolor: 'background.paper', borderRadius: 4, boxShadow: 24, p: 0, overflow: 'hidden'
        }}>
          <Box sx={{ p: 3, bgcolor: '#01337a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={800}>Group Evaluation Details</Typography>
            <IconButton onClick={() => setModalOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
          </Box>
          
          <Box sx={{ p: 4, maxHeight: '75vh', overflowY: 'auto' }}>
            <Stack spacing={4}>
              <Stack direction="row" spacing={4} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>GROUP ID</Typography>
                  <Typography variant="h6" fontWeight={900} color="#01337a">{maskGroupId(selectedEval?.groupId)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>FYP PART</Typography>
                  <Typography variant="h6" fontWeight={900}>{selectedEval?.year}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>SUPERVISOR</Typography>
                  <Typography variant="h6" fontWeight={900} color="#01337a">{selectedEval?.supervisorName}</Typography>
                </Box>
              </Stack>

              <Typography variant="h6" fontWeight={800} color="#01337a" sx={{ borderBottom: '2px solid #e2e8f0', pb: 1 }}>
                Student Wise Marks
              </Typography>
              
              {(selectedEval?.students || []).map((stu, i) => {
                // Find matching evaluation in the raw supervisorEvaluations array
                const detailedEval = (selectedEval?.supervisorEvaluations || []).find(ev => 
                  String(ev.studentName || ev.name).trim().toLowerCase() === String(stu.studentName).trim().toLowerCase()
                );

                return (
                  <Box key={i} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ p: 2, bgcolor: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" fontWeight={800} color="#1e293b">{stu.studentName}</Typography>
                        <Typography variant="caption" color="text.secondary">SAP ID: {stu.sapId}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" fontWeight={900} color="#01337a">{stu.marks}<span style={{ fontSize: '0.8rem', color: '#64748b' }}>/50</span></Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Total Scaled Score</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong style={{ color: '#475569' }}>Evaluation Type:</strong> {detailedEval?.name || detailedEval?.label || "Supervisor Assessment"}
                      </Typography>
                      
                      {stu.supervisorRemarks && stu.supervisorRemarks !== "—" && (
                        <Box sx={{ mt: 1, p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
                          <Typography variant="caption" color="#0369a1" fontWeight={800} display="block" sx={{ mb: 0.5 }}>SUPERVISOR REMARKS</Typography>
                          <Typography variant="body2" color="#0c4a6e" sx={{ fontStyle: 'italic' }}>
                            {stu.supervisorRemarks}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
          
          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
            <Button variant="contained" onClick={() => setModalOpen(false)} sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#01337a' }}>Close Details</Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
