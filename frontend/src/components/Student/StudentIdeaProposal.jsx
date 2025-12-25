import React, { useEffect, useState } from "react";
import DashboardSectionHeader from "../Student/DashboardSectionHeader";
import { DropdownMultiSelect } from "../Admin/DropDowns.jsx";
import ToastService from "../ToastService/ToastService.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import { studentsSupervisorApi } from "../Api/StudentApi/StudentSupervisorApi.jsx";
import { GetTitle } from "../Api/AiService.jsx";
import {
  checkExistingProposal,
  createProposal,
  deleteProposal,
} from "../Api/Proposals/proposalApi.jsx";
import "./StudentIdeaProposal.css";

const ALL_SPECIALITIES = [
  "AI",
  "ML",
  "Web",
  "Cloud",
  "Data Science",
  "Networks",
  "Security",
  "IoT",
  "Embedded",
  "Software Engineering",
];

const STATUS_LABELS = {
  0: "Pending review",
  1: "Approved",
  2: "Rejected",
};

const INITIAL_FORM_STATE = {
  title: "",
  description: "",
  tools: "",
  speciality: [],
};

const isValidObjectId = (id) =>
  typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

const getStatusLabel = (status) => STATUS_LABELS[Number(status)] || "Unknown";

export default function StudentIdeaProposal({ onTabChange }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [supervisors, setSupervisors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [existingProposal, setExistingProposal] = useState(null);
  const [checkingProposal, setCheckingProposal] = useState(false);
  const [selectingSupervisor, setSelectingSupervisor] = useState(false);

  // timeLeftMs for auto-delete note (24 hours from createdAt) - live ticking
  const [timeLeftMs, setTimeLeftMs] = useState(null);

  const groupId = localStorage.getItem("groupId") || null;

  useEffect(() => {
    if (!groupId) {
      onTabChange("My Group");
      return;
    }

    let mounted = true;

    const loadExistingProposal = async () => {
      setCheckingProposal(true);
      try {
        const proposal = await checkExistingProposal(groupId);
        if (!mounted) return;
        if (proposal) {
          setExistingProposal(proposal);
          prefillForm(proposal);
          setSubmissionResult("alreadySubmitted");
        } else {
          setExistingProposal(null);
          setSubmissionResult(null);
        }
      } catch (error) {
        ToastService.error(error.message || "Unable to check existing proposal");
      } finally {
        if (mounted) setCheckingProposal(false);
      }
    };

    loadExistingProposal();

    return () => {
      mounted = false;
    };
  }, [groupId, submissionResult, onTabChange]);

  // Live countdown effect for pending proposal auto-delete (24 hours)
  useEffect(() => {
    let interval = null;

    const computeAndSet = () => {
      if (!existingProposal || !existingProposal.createdAt) {
        setTimeLeftMs(null);
        return;
      }
      // only for pending proposals
      if (Number(existingProposal.projectStatus) !== 0) {
        setTimeLeftMs(null);
        return;
      }
      const createdMs = new Date(existingProposal.createdAt).getTime();
      const deadlineMs = createdMs + 24 * 60 * 60 * 1000;
      const nowMs = Date.now();
      const left = Math.max(deadlineMs - nowMs, 0);
      setTimeLeftMs(left);
    };

    computeAndSet();
    if (existingProposal && Number(existingProposal.projectStatus) === 0) {
      interval = setInterval(computeAndSet, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [existingProposal]);

  const prefillForm = (proposal) => {
    setFormData({
      title: proposal.projectTitle || "",
      description: proposal.projectDescription || "",
      tools: proposal.projectTools || "",
      speciality: proposal.projectSpecialization ? [proposal.projectSpecialization] : [],
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpecialityChange = (value) => {
    setFormData((prev) => ({ ...prev, speciality: value }));
  };

  const resetForm = async () => {
    try {
      if (existingProposal && existingProposal._id) {
        await deleteProposal(existingProposal._id);
      }
    } catch (error) {
      ToastService.error("cant resubmit proposal right Now");
      return;
    }
    setFormData(INITIAL_FORM_STATE);
    setSupervisors([]);
    setAiSuggestions([]);
    setIsModalOpen(false);
    setSubmissionResult(null);
    setExistingProposal(null);
    setTimeLeftMs(null);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      ToastService.error("Project title is required.");
      return false;
    }
    if (!formData.description.trim()) {
      ToastService.error("Project description is required.");
      return false;
    }
    if (!formData.tools.trim()) {
      ToastService.error("Project tools are required.");
      return false;
    }
    if (formData.speciality.length === 0) {
      ToastService.error("Please select at least one speciality.");
      return false;
    }
    return true;
  };

  const handleOpenSupervisorDialog = async (e) => {
    e.preventDefault();
    if (existingProposal) {
      ToastService.error("Your group already has a submitted proposal.");
      return;
    }
    if (!validateForm()) return;
    const confirmed = await Confirm(
      `Supervisor will be searched based on speciality "${formData.speciality.join(", ")}"? Are you sure?`
    );

    if (!confirmed) return;

    await fetchSupervisors();
  };

  const fetchSupervisors = async () => {
    try {
      const response = await studentsSupervisorApi.getSupervisorOnSpeciality(formData.speciality);
      if (!response?.data?.length) {
        ToastService.error("No supervisor available for selected speciality!");
        return;
      }
      setSupervisors(response.data);
      setIsModalOpen(true);
    } catch (error) {
      ToastService.error("Error fetching supervisors. Please try again.");
    }
  };

  const handleSelectSupervisor = async (supervisor) => {
    setIsModalOpen(false);
    setSelectingSupervisor(true);
    if (!groupId || !isValidObjectId(groupId)) {
      ToastService.error("Group ID missing or invalid. Please create your group first.");
      setSelectingSupervisor(false);
      return;
    }
    try {
      await createNewProposalWithSupervisor(supervisor);
    } catch (error) {
      handleSupervisorSelectionError(error);
    } finally {
      setSelectingSupervisor(false);
    }
  };

  const createNewProposalWithSupervisor = async (supervisor) => {
    const payload = {
      groupId,
      projectTitle: formData.title,
      projectDescription: formData.description,
      projectTools: formData.tools,
      specialization: Array.isArray(formData.speciality) ? formData.speciality[0] : formData.speciality,
      projectSupervisor: supervisor.email,
      projectStatus: 0,
    };

    const proposalObj = await createProposal(payload);

    setSubmissionResult("selected");
    setExistingProposal(proposalObj);

    ToastService.success(`Supervisor ${supervisor.name || supervisor.email} selected and proposal submitted.`);
  };

  const handleSupervisorSelectionError = (error) => {
    if (error.data?.missingFields) {
      ToastService.error(error.data.error || `Required fields missing: ${error.data.missingFields.join(", ")}`);
    } else {
      ToastService.error(error.message || "Network error while assigning supervisor.");
    }
  };

  const handleAiSuggest = async () => {
    if (!formData.title.trim()) {
      ToastService.error("Please enter a project title first.");
      return;
    }
    setLoadingTitle(true);
    try {
      const suggestions = await GetTitle(formData.title);
      setAiSuggestions(suggestions || []);
    } catch (error) {
      ToastService.error("AI suggestion failed. Please try again.");
    } finally {
      setLoadingTitle(false);
    }
  };

  const handleAiSuggestionClick = (title) => {
    setFormData((prev) => ({ ...prev, title }));
  };

  if (checkingProposal) {
    return (
      <div className="idea-proposal-container">
        <DashboardSectionHeader
          description="Propose your FYP project, describe it briefly, list the tools you plan
          to use, and choose your speciality. Once done, select a supervisor to
          continue."
        >
          Idea & Proposal
        </DashboardSectionHeader>
        <div className="result-card info">
          <h2>Loading proposal...</h2>
        </div>
      </div>
    );
  }

  // Format ms to HH:MM:SS
  const formatMs = (ms) => {
    if (ms == null) return "-";
    if (ms <= 0) return "00:00:00";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  return (
    <div className="idea-proposal-container">
      <DashboardSectionHeader
        description="Propose your FYP project, describe it briefly, list the tools you plan
          to use, and choose your speciality. Once done, select a supervisor to
          continue."
      >
        Idea & Proposal
      </DashboardSectionHeader>

      {submissionResult === "alreadySubmitted" && existingProposal ? (
        <ExistingProposalCard proposal={existingProposal} onReset={resetForm} timeLeftMs={timeLeftMs} formatMs={formatMs} />
      ) : (
        <ProposalForm
          formData={formData}
          aiSuggestions={aiSuggestions}
          loadingTitle={loadingTitle}
          onChange={handleChange}
          onSpecialityChange={handleSpecialityChange}
          onSubmit={handleOpenSupervisorDialog}
          onAiSuggest={handleAiSuggest}
          onAiSuggestionClick={handleAiSuggestionClick}
        />
      )}

      {isModalOpen && supervisors.length > 0 && (
        <SupervisorModal supervisors={supervisors} onClose={() => setIsModalOpen(false)} onSelect={handleSelectSupervisor} isSelecting={selectingSupervisor} />
      )}
    </div>
  );
}

const ExistingProposalCard = ({ proposal, onReset, timeLeftMs, formatMs }) => {
  const isPending = Number(proposal.projectStatus) === 0;
  const expired = isPending && (timeLeftMs === 0 || timeLeftMs <= 0);

  return (
    <div className="result-card info" style={{ position: "relative", paddingBottom: 28 }}>
      <p style={{ fontSize: 35, color: "#01337a", fontWeight: 700 }}>Proposal Details</p>

      <ProposalDetail label="Project Title" value={proposal.projectTitle} />
      <ProposalDetail label="Project Description" value={proposal.projectDescription} preWrap />
      <ProposalDetail label="Tools / Technologies" value={proposal.projectTools} />
      <ProposalDetail label="Speciality" value={proposal.projectSpecialization || (proposal.projectSpecialization || []).join(", ")} />
      <ProposalDetail label="Supervisor" value={proposal.projectSupervisor} />
      <ProposalDetail label="Status" value={getStatusLabel(proposal.projectStatus)} />
      <ProposalDetail label="Supervisor Comments" value={proposal.projectSupervisorComments || "N/A"} />

      {/* NOTE BOX: shown when status is pending (0) */}
      {isPending && (
        <div
          style={{
            marginTop: 18,
            padding: 14,
            background: "#fff7de",
            borderRadius: 8,
            border: "1px solid #ffe6b2",
            color: "#b97b16",
            fontWeight: 700,
            boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
          }}
        >
          {expired ? (
            <>
              This pending proposal has expired and will be deleted. If you don't see changes, refresh the page.
            </>
          ) : (
            <>
              Note: This proposal is currently pending. It will be automatically deleted in{" "}
              <span style={{ color: "#01337a", marginLeft: 6 }}>{formatMs(timeLeftMs)}</span>.
            </>
          )}
        </div>
      )}

      <div className="result-actions" style={{ marginTop: 18 }}>
        {Number(proposal.projectStatus) === 2 && (
          <button className="submit-btn" onClick={onReset}>
            Re Submit Proposal
          </button>
        )}
      </div>
    </div>
  );
};

const ProposalDetail = ({ label, value, preWrap = false }) => (
  <div style={{ marginTop: 12 }}>
    <label>{label}:</label>
    <div style={{ marginTop: 6, fontSize: 22, whiteSpace: preWrap ? "pre-wrap" : "normal" }}>{value || "-"}</div>
  </div>
);

const ProposalForm = ({ formData, aiSuggestions, loadingTitle, onChange, onSpecialityChange, onSubmit, onAiSuggest, onAiSuggestionClick }) => (
  <form onSubmit={onSubmit} className="proposal-form">
    <div className="form-group">
      <label>
        Project Title <span className="required">*</span>
      </label>
      <div className="flex items-center gap-2">
        <input type="text" name="title" value={formData.title} onChange={onChange} placeholder="Enter your project title" required className="flex-1" />
        <button type="button" className={`ai-suggest-btn ${loadingTitle ? "loading" : ""}`} onClick={onAiSuggest} disabled={loadingTitle}>
          {loadingTitle ? "AI Thinking..." : "✨ AI Suggest"}
        </button>
      </div>

      {aiSuggestions.length > 0 && (
        <div className="ai-suggestions">
          {aiSuggestions.map((title, i) => (
            <div key={i} onClick={() => onAiSuggestionClick(title)} className="ai-suggestion-item" role="button" tabIndex={0}>
              <span className="ai-emoji">💡</span>
              {title}
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="form-group">
      <label>
        Project Description <span className="required">*</span>
      </label>
      <textarea name="description" value={formData.description} onChange={onChange} placeholder="Briefly describe your project idea" rows="4" required />
    </div>

    <div className="form-group">
      <label>
        Tools / Technologies <span className="required">*</span>
      </label>
      <input type="text" name="tools" value={formData.tools} onChange={onChange} placeholder="e.g. React, Node.js, TensorFlow" required />
    </div>
    <div className="form-group">
      <label>
        Speciality <span className="required">*</span>
      </label>
      <DropdownMultiSelect value={formData.speciality} options={ALL_SPECIALITIES} onChange={onSpecialityChange} placeholder="Select relevant specialities" />
    </div>
    <div className="form-buttons">
      <button type="submit" className="submit-btn">
        Search Supervisor
      </button>
    </div>
  </form>
);

const SupervisorModal = ({ supervisors, onClose, onSelect, isSelecting }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <button onClick={onClose} className="modal-close-btn">
        ✖
      </button>
      <h2 className="modal-title">Available Supervisors</h2>
      <div className="supervisor-list">
        {supervisors.map((supervisor) => (
          <SupervisorCard key={supervisor._id} supervisor={supervisor} onSelect={() => onSelect(supervisor)} isSelecting={isSelecting} />
        ))}
      </div>
    </div>
  </div>
);

const SupervisorCard = ({ supervisor, onSelect, isSelecting }) => {
  const remainingSlots = Math.max(0, (supervisor.availableSlots || 0) - (supervisor.bookedSlots || 0));

  return (
    <div className="supervisor-card">
      <div>
        <h3>{supervisor.name}</h3>
        <p>
          <strong>Department:</strong> {supervisor.department}
        </p>
        <p>
          <strong>Specialization:</strong> {supervisor.specialization}
        </p>
        <p>
          <strong>Slots:</strong> <span className="slots">{remainingSlots} remaining</span>
        </p>
      </div>
      <button onClick={onSelect} className="select-btn" disabled={isSelecting}>
        {isSelecting ? "Assigning..." : "Select Supervisor"}
      </button>
    </div>
  );
};