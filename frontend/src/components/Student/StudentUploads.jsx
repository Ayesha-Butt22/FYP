// StudentUploads - Template upload manager (SRS-14.9 / SRS-14.10)
import React, { useEffect, useState, useRef } from "react";
import { Box } from "@mui/material";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";
import AppTable from "../Admin/AppTable.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import "./StudentUploads.css";
import TemplateService from "../Api/TemplateService.jsx";


const calculateDueDate = (startDate, week) => {
    if (!startDate) return "—";
    const d = new Date(startDate);
    d.setDate(d.getDate() + week * 7);
    return d.toISOString().split("T")[0];
};

const getCurrentWeek = (semesterStart) => {
    if (!semesterStart) return 0;
    const start = new Date(semesterStart);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
};

/* ================= TEMPLATE DEFINITIONS ================= */
const TEMPLATE_DEFINITIONS = [
    { code: "t01", label: "Template-01: Project Team List (MS Word)", week: 1, fypPart: 1 },
    { code: "t02", label: "Template-02: Initial Proposal (MS Word)", week: 2, fypPart: 1 },
    { code: "t03", label: "Template-03: Proposal Presentation (PPT)", week: 4, fypPart: 1 },
    { code: "t04", label: "Template-04: Proposal & Plan (MS Word)", week: 6, fypPart: 1 },
    { code: "t05", label: "Template-05: Project Report (MS Word)", week: 16, fypPart: 1 },
    { code: "t07", label: "Template-07: Final Presentation (PPT)", week: 16, fypPart: 1 },
    // FYP-2 
    { code: "t05", label: "Template-05: Project Report (MS Word)", week: 13, fypPart: 2 },
    { code: "t06", label: "Template-06: Complete Project Report (PPT)", week: 14, fypPart: 2 },
];

const API_BASE = "http://localhost:5000";

export default function StudentUploads() {
    const [allFiles, setAllFiles] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [semesterStart, setSemesterStart] = useState(null);
    const [studentInfo, setStudentInfo] = useState(null);
    const [fypYear, setFypYear] = useState(() => {
        return parseInt(localStorage.getItem("fypYear") || "1");
    });
    const [depTemplate, setDepTemplate] = useState(null);
    const [fypResults, setFypResults] = useState([]);
    const storedDept = localStorage.getItem("department");

    const headers = ["Template", "Due Date", "Status", "Remarks", "Upload Date"];
    const fileInputRefs = useRef({});
    const studentId = localStorage.getItem("studentId") || localStorage.getItem("sapId");
    const studentEmail = localStorage.getItem("email");

    const normalizeStatus = (raw) => {
        if (!raw) return "Pending";
        const map = {
            pending: "Pending",
            submitted: "Under Review",
            approved: "Approved",
            rejected: "Rejected",
        };
        return map[String(raw).toLowerCase()] || raw;
    };

    const loadUploadedTemplate = async (dept) => {
        if (!dept) return;
        try {
            const url = `${API_BASE}/api/templates?department=${dept}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setDepTemplate(data.data || []);
            }
        } catch (err) {
            console.error("Error loading templates:", err);
        }
    };

    useEffect(() => {
        const loadSemesterStart = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/semester-start`);
                const data = await res.json();
                setSemesterStart(data?.date || null);
            } catch (err) {
                console.error(err);
                toastService.error("Semester start date not found");
            }
        };
        loadSemesterStart();
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            const currentId = localStorage.getItem("studentId") || localStorage.getItem("sapId");
            const currentEmail = localStorage.getItem("email");

            if (!currentId && !currentEmail) return;

            try {
                setLoading(true);
                let data = null;
                if (currentId) {
                    try {
                        data = await TemplateService.getStudentInfo(currentId);
                    } catch (e) { console.log("ID lookup failed, trying email..."); }
                }

                // Fallback to finding user by email if ID lookup fails
                if (!data && currentEmail) {
                    const profileRes = await fetch(`${API_BASE}/api/auth/user-by-email/${currentEmail}`);
                    if (profileRes.ok) {
                        const pData = await profileRes.json();
                        if (pData.success && pData.user) {
                            const resolvedId = pData.user.studentId || pData.user.sapId;
                            if (resolvedId) data = await TemplateService.getStudentInfo(resolvedId);
                            else if (pData.user._id) data = await TemplateService.getStudentInfo(pData.user._id);
                        }
                    }
                }

                if (data) {
                    setStudentInfo(data);
                    const dept = data.department || localStorage.getItem("department");
                    if (dept) await loadUploadedTemplate(dept);

                    // --- AUTOMATIC FYP YEAR TRANSITION CHECK ---
                    if (currentEmail) {
                        try {
                            const res = await fetch(`${API_BASE}/api/coordinator/final-results`, {
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                            });
                            if (res.ok) {
                                const rData = await res.json();
                                if (rData.success) {
                                    const myResults = rData.data.filter(r => String(r.sapId) === String(currentId));
                                    setFypResults(myResults);

                                    // Auto check transition
                                    const fyp1Pass = myResults.find(r => r.year === "FYP-1" && r.status === "Pass");
                                    if (fyp1Pass) {
                                        setFypYear(2);
                                        localStorage.setItem("fypYear", "2");
                                    }
                                }
                            }
                        } catch (e) { console.warn("Final results fetch failed"); }
                    }
                }
            } catch (err) {
                console.error(err);
                toastService.error("Could not load student info");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [studentId, studentEmail]);


    useEffect(() => {
        if (studentInfo?.groupId) {
            loadTemplates();
        }
    }, [studentInfo]);

    useEffect(() => {
        applyFilters();
    }, [allFiles, semesterStart, depTemplate, fypYear, studentInfo]);

    useEffect(() => {
        if (!semesterStart) return;
        const currentWeek = getCurrentWeek(semesterStart);
        toastService.info(`📅 Current week: ${currentWeek}. Check the template to submit this week.`);
    }, [semesterStart]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const files = await TemplateService.getFiles(studentInfo.groupId);
            const normalized = files.map((f) => ({
                id: f._id,
                template: f.templateCode,
                filename: f.originalName,
                filePath: f.filePath,
                status: normalizeStatus(f.status),
                uploadedAt: new Date(f.uploadedAt).toLocaleDateString(),
                remarks: f.supervisorRemarks ?? 'No Remarks Provided',
                label: f.templateLabel,
                fypPart: Number(f.fypPart),
            }));
            setAllFiles(normalized);
        } catch (err) {
            console.error(err);
            toastService.error("Could not load templates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!allFiles || allFiles.length === 0) return;
        const FYP1_TEMPLATES = ["t01", "t02", "t03", "t04", "t05", "t07"];

        const fyp1TemplatesApproved = allFiles.filter(
            f =>
                FYP1_TEMPLATES.includes(f.template) &&
                Number(f.fypPart) === 1 &&
                f.status === "Approved"
        ).length === FYP1_TEMPLATES.length;

        if (fyp1TemplatesApproved && fypYear === 1) {
            setFypYear(2);
            localStorage.setItem("fypYear", "2");
        }
    }, [allFiles, fypYear]);

    const applyFilters = () => {
        if (!studentInfo || !depTemplate) return;

        // We want to show ALL templates for a better overview
        const visibleTemplates = TEMPLATE_DEFINITIONS;

        const tableRows = [];

        visibleTemplates.forEach((tpl) => {
            const isFyp2Template = tpl.fypPart === 2;

            // Should we show this template row?
            // Rule: Show FYP-1 always. Show FYP-2 only if fypYear >= 2.
            if (isFyp2Template && fypYear < 2) return;

            const file = allFiles.find(
                (f) =>
                    f.template === tpl.code &&
                    Number(f.fypPart) === Number(tpl.fypPart)
            );
            const partLabel = isFyp2Template ? "FYP-2" : "FYP-1";

            // Adjust Week for FYP-2 (usually offset or dynamic)
            // const weekForCalc = isFyp2Template ? tpl.week : tpl.week;

            tableRows.push({
                Template: `${tpl.label} (${partLabel})`,
                "Due Date": calculateDueDate(semesterStart, tpl.week),
                Status: file ? file.status : "Upload Pending",
                Remarks: file ? file.remarks : "N/A",
                "Upload Date": file ? file.uploadedAt : "N/A",
                __meta: {
                    template: tpl.code,
                    file: file,
                    dueDate: calculateDueDate(semesterStart, tpl.week),
                    fypPart: tpl.fypPart
                },
            });
        });

        setRows(tableRows);
    }

    const buildFileUrl = (path) => TemplateService.buildFileUrl(path);

    const handleDownload = (row) => {
        const file = row.__meta.file;
        if (!file?.filePath) return;
        const a = document.createElement("a");
        a.href = buildFileUrl(file.filePath);
        a.download = file.filename;
        a.click();
    };

    const handleTriggerUpload = (row) => {
        const tplCode = row.__meta.template;
        const fypPart = row.__meta.fypPart;
        const key = `${tplCode}_${fypPart}`;

        if (!fileInputRefs.current[key]) {
            const input = document.createElement("input");
            input.type = "file";
            // Check if template is PPT related (t03, t06, t07) or specifically t03 as requested
            if (tplCode === "t03") {
                input.accept = ".ppt,.pptx";
            } else {
                input.accept = ".doc,.docx,.ppt,.pptx";
            }
            input.onchange = (e) => handleFileSelected(e, tplCode, fypPart);
            fileInputRefs.current[key] = input;
        }
        fileInputRefs.current[key].click();
    };

    const handleFileSelected = async (e, tplCode, fypPart) => {
        const file = e.target.files[0];
        if (!file) return;

        // Strict extension check for t03
        if (tplCode === "t03") {
            const ext = file.name.split('.').pop().toLowerCase();
            if (ext !== "ppt" && ext !== "pptx") {
                toastService.error("Only PowerPoint files (.ppt, .pptx) are allowed for this template.");
                e.target.value = null; // reset
                return;
            }
        }

        const currentId = localStorage.getItem("studentId") || localStorage.getItem("sapId");
        if (!currentId) {
            toastService.error("Student ID missing. Please log in again.");
            return;
        }

        const tplDef = TEMPLATE_DEFINITIONS.find(t => t.code === tplCode && t.fypPart === fypPart);
        const week = tplDef ? tplDef.week : 1;

        try {
            setLoading(true);
            const res = await TemplateService.uploadFile(tplCode, file, currentId, week, fypPart);
            if (res.success) {
                toastService.success(`Successfully uploaded ${tplCode}`);
                await loadTemplates();
            } else {
                toastService.error(res.message || "Upload failed");
            }
        } catch (err) {
            console.error(err);
            toastService.error(err.response?.data?.message || "Error uploading file");
        } finally {
            setLoading(false);
            // reset input
            e.target.value = null;
        }
    };

    const renderActions = (row) => {
        const file = row.__meta.file;
        return (
            <Box sx={{ display: "flex", gap: 8 }}>
                {file && (
                    <button
                        className="mt-btn"
                        style={{ background: "#2563eb" }}
                        onClick={() => handleDownload(row)}
                    >
                        Download
                    </button>
                )}
                <button
                    className="mt-btn"
                    style={{ background: "#10b981", color: "#fff" }}
                    onClick={() => handleTriggerUpload(row)}
                >
                    {file ? "Re-upload" : "Upload"}
                </button>
            </Box>
        );
    };

    return (
        <Box sx={{ pb: 3 }}>
            <DashboardSectionHeader description="Here you can upload your project templates or view their status.">
                Uploads Template
            </DashboardSectionHeader>


            {loading ? (
                <div className="st-loading">Loading…</div>
            ) : (
                <>
                    {/* Dynamic Status Banners */}
                    {fypResults.find(r => r.year === "FYP-2" && r.status === "Pass") ? (
                        <Box className="completion-message-banner" sx={{ bgcolor: '#ecfdf5', borderColor: '#10b981' }}>
                            <span className="completion-icon">🎓</span>
                            <div>
                                <strong style={{ color: '#047857' }}>Project Fully Completed!</strong>
                                <p style={{ color: '#065f46' }}>Congratulations! You have passed FYP-2. Your project is successfully completed.</p>
                            </div>
                        </Box>
                    ) : fypResults.find(r => r.year === "FYP-1" && r.status === "Pass") && fyp1TemplatesApproved ? (
                        <Box className="completion-message-banner" sx={{ bgcolor: '#eff6ff', borderColor: '#3b82f6' }}>
                            <span className="completion-icon">🚀</span>
                            <div>
                                <strong style={{ color: '#1d4ed8' }}>FYP-1 Successfully Passed!</strong>
                                <p style={{ color: '#1e40af' }}>You have passed FYP-1 and ALLtemplates are approved. You are now authorized to upload FYP-2 specific templates (Progress & Final Report).</p>
                            </div>
                        </Box>
                    ) : studentInfo?.isArchived && (
                        <Box className="completion-message-banner">
                            <span className="completion-icon">🏆</span>
                            <div>
                                <strong>Project Archived</strong>
                                <p>This project has been moved to the FYP Archive.</p>
                            </div>
                        </Box>
                    )}
                    {/* <label>Fyp Year = {fypYear}</label> */}
                    {!studentInfo?.isArchived && (
                        <AppTable headers={headers} rows={rows} renderActions={renderActions} />
                    )}
                </>
            )}
        </Box>
    );
}