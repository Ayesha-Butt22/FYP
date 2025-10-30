import React, { useState, useEffect } from "react";
import DashboardSectionHeader from "../Student/DashboardSectionHeader";
import { DropdownMultiSelect } from "../Admin/DropDowns.jsx";
import "./StudentIdeaProposal.css";
import ToastService from "../ToastService/ToastService.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import { studentsSupervisorApi } from "../Api/StudentApi/StudentSupervisorApi.jsx";
import { GetTitle } from "../Api/AiService.jsx";

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

const statusLabel = (status) => {
  // Map numeric status to readable label
  switch (Number(status)) {
    case 0:
      return "Pending review";
    case 1:
      return "Approved";
    case 2:
      return "Rejected";
    default:
      return "Unknown";
  }
};

export default function StudentIdeaProposal() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tools: "",
    speciality: [],
  });

  const [supervisors, setSupervisors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingTitle, setLoadingTitle] = useState(false);

  const [submissionResult, setSubmissionResult] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  // groupId from localStorage (as you already used elsewhere)
  const groupId = localStorage.getItem("groupId") || null;

  // NEW: state to hold existing proposal check result
  const [existingProposal, setExistingProposal] = useState(null);
  const [checkingProposal, setCheckingProposal] = useState(false);

  // ---------- INSERTED useEffect: check if this group already has a proposal ----------
  useEffect(() => {
    if (!groupId) {
      setExistingProposal(null);
      return;
    }

    let mounted = true;
    const checkExistingProposal = async () => {
      setCheckingProposal(true);
      try {
        const resp = await fetch(`http://localhost:5000/api/proposals/${encodeURIComponent(groupId)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (resp.ok) {
          const data = await resp.json();
          if (!mounted) return;
          // API returns an array — take the first proposal
          const p = Array.isArray(data) ? data[0] || null : data;
          if (p) {
            setExistingProposal(p);

            // prefill the form (optional)
            setFormData((prev) => ({
              ...prev,
              title: p.projectTitle || prev.title,
              description: p.projectDescription || prev.description,
              tools: p.projectTools || prev.tools,
              speciality: p.specialization ? [p.specialization] : prev.speciality,
            }));

            // switch UI to "alreadySubmitted" state so we show the proposal card
            setSubmissionResult("alreadySubmitted");
            ToastService.success("Existing proposal loaded");
          } else {
            setExistingProposal(null);
            setSubmissionResult(null);
          }
        } else {
          if (resp.status === 404) {
            // no proposal — allow create/submit
            setExistingProposal(null);
            setSubmissionResult(null);
          } else {
            let errMsg = `Failed to check proposal (status ${resp.status})`;
            try {
              const j = await resp.json();
              if (j && j.error) errMsg = j.error;
            } catch {}
            ToastService.error(errMsg);
          }
        }
      } catch (err) {
        ToastService.error("Unable to check existing proposal. Please check your connection.");
      } finally {
        if (mounted) setCheckingProposal(false);
      }
    };

    checkExistingProposal();

    return () => {
      mounted = false;
    };
  }, [groupId]);
  // ------------------------------------------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpecialityChange = (value) => {
    setFormData((prev) => ({ ...prev, speciality: value }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      tools: "",
      speciality: [],
    });
    setSupervisors([]);
    setAiSuggestions([]);
    setIsModalOpen(false);
    setSubmissionResult(null);
    setSelectedSupervisor(null);
    setExistingProposal(null);
  };

  const handleOpenSupervisorDialog = (e) => {
    e.preventDefault();

    // If backend already reports a submitted proposal, block re-submission
    if (existingProposal) {
      ToastService.error("Your group already has a submitted proposal.");
      return;
    }

    if (!formData.title.trim()) {
      ToastService.error("Project title is required.");
      return;
    }
    if (!formData.description.trim()) {
      ToastService.error("Project description is required.");
      return;
    }
    if (!formData.tools.trim()) {
      ToastService.error("Project tool is required.");
      return;
    }
    if (formData.speciality.length === 0) {
      ToastService.error("Please select at least one speciality.");
      return;
    }

    checkSpeciality();
  };

  const checkSpeciality = async () => {
    const confirmed = await Confirm(
      `Supervisor will be searched on this speciality "${formData.speciality}"? Are you Sure?`
    );
    if (!confirmed) return;

    try {
      const response = await studentsSupervisorApi.getSupervisorOnSpeciality(
        formData.speciality
      );
      // If API returns count === 0 or empty data, we set "not-selected" so the user sees the card
      if (!response || response.count === 0 || !Array.isArray(response.data) || response.data.length === 0) {
        setSubmissionResult("not-selected");
        ToastService.error("No supervisor available for current speciality!");
        return;
      }

      // Supervisors found — open modal to let the student select
      setSupervisors(response.data);
      setIsModalOpen(true);
    } catch (error) {
      ToastService.error("Error fetching supervisors. Please try again.");
    }
  };

  const handleSelectSupervisor = (supervisor) => {
    // Mark idea as selected and show the success card; clear the form inputs as requested
    setSelectedSupervisor(supervisor);
    setSubmissionResult("selected");
    setIsModalOpen(false);

    // Optionally persist selection to backend here (not implemented)
    ToastService.success(`Supervisor "${supervisor.name}" selected successfully!`);
  };

  // AI Suggest button handler (keeps same behavior)
  const handleAiSuggest = async () => {
    if (!formData.title.trim()) {
      ToastService.error("Please enter a project title first.");
      return;
    }
    setLoadingTitle(true);
    try {
      const suggestions = await GetTitle(formData.title);
      setAiSuggestions(suggestions || []);
    } catch (err) {
      ToastService.error("AI suggestion failed. Try again.");
    } finally {
      setLoadingTitle(false);
    }
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

      {/* Submitted-by-student success card */}
      {submissionResult === "selected" ? (
        <div className="result-card success">
          <h2>Your project idea has been submitted to supervisor successfully</h2>
          <p>
            Congratulations — your idea has been sent to <strong>{selectedSupervisor?.name}</strong>. Now wait for
            supervisor action
          </p>
          <p>Your proposal status is right now pending</p>
          <p>Supervisor Comments: N/A</p>
          <div className="result-actions">
            <button className="submit-btn" onClick={() => resetForm()}>
              OK
            </button>
          </div>
        </div>

      ) : submissionResult === "alreadySubmitted" && existingProposal ? (
        // Existing proposal card (when API returned proposal data)
        <div className="result-card info">
          <h2>Your group has already submitted a proposal</h2>

          <div style={{ marginTop: 12 }}>
            <strong>Project Title:</strong>
            <div style={{ marginTop: 6 }}>{existingProposal.projectTitle || "-"}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Project Description:</strong>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{existingProposal.projectDescription || "-"}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Tools / Technologies:</strong>
            <div style={{ marginTop: 6 }}>{existingProposal.projectTools || "-"}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Speciality:</strong>
            <div style={{ marginTop: 6 }}>{existingProposal.specialization || (existingProposal.speciality || []).join(", ") || "-"}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Supervisor:</strong>
            <div style={{ marginTop: 6 }}>{existingProposal.projectSupervisor || "-"}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Status:</strong>
            <div style={{ marginTop: 6 }}>{statusLabel(existingProposal.projectStatus)}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Supervisor Comments:</strong>
            <div style={{ marginTop: 6 }}>{existingProposal.projectSupervisorComments || "N/A"}</div>
          </div>

          <div className="result-actions" style={{ marginTop: 18 }}>
            <button className="submit-btn" onClick={() => resetForm()}>
              OK
            </button>
          </div>
        </div>

      ) : submissionResult === "not-selected" ? (
        <div className="result-card failure">
          <h2>Your idea has not been selected</h2>
          <p>
            Unfortunately we couldn't find a matching supervisor for the selected speciality.
            Please revise your idea or try different specialities and resubmit.
          </p>
          <div className="result-actions">
            <button
              className="submit-btn"
              onClick={() => {
                // allow resubmit
                setSubmissionResult(null);
                setIsModalOpen(false);
              }}
            >
              Resubmit Idea
            </button>
          </div>
        </div>
      ) : (
        // Default form (only shown when there is no existing proposal)
        <form onSubmit={handleOpenSupervisorDialog} className="proposal-form">
          <div className="form-group">
            <label>
              Project Title <span className="required">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => handleChange(e)}
                placeholder="Enter your project title"
                required
                className="flex-1"
              />
              <button
                type="button"
                className={`ai-suggest-btn ${loadingTitle ? "loading" : ""}`}
                onClick={handleAiSuggest}
                disabled={loadingTitle}
              >
                {loadingTitle ? "AI Thinking..." : "✨ AI Suggest"}
              </button>
            </div>

            {aiSuggestions.length > 0 && (
              <div className="ai-suggestions">
                {aiSuggestions.map((title, i) => (
                  <div
                    key={i}
                    onClick={() => setFormData((prev) => ({ ...prev, title }))}
                    className="ai-suggestion-item"
                    role="button"
                    tabIndex={0}
                  >
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
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Briefly describe your project idea"
              rows="4"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label>
              Tools / Technologies <span className="required">*</span>
            </label>
            <input
              type="text"
              name="tools"
              value={formData.tools}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, TensorFlow"
              required
            />
          </div>

          <div className="form-group">
            <label>
              Speciality <span className="required">*</span>
            </label>
            <DropdownMultiSelect
              value={formData.speciality}
              options={ALL_SPECIALITIES}
              onChange={handleSpecialityChange}
              placeholder="Select relevant specialities"
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="submit-btn">
              Search Supervisor
            </button>
          </div>
        </form>
      )}

      {/* Supervisor selection modal (only when supervisors are available) */}
      {isModalOpen && supervisors && supervisors.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
              ✖
            </button>
            <h2 className="modal-title">Available Supervisors</h2>

            <div className="supervisor-list">
              {supervisors.map((supervisor) => (
                <div key={supervisor._id} className="supervisor-card">
                  <div>
                    <h3>{supervisor.name}</h3>
                    <p>
                      <strong>Department:</strong> {supervisor.department}
                    </p>
                    <p>
                      <strong>Specialization:</strong> {supervisor.specialization}
                    </p>
                    <p>
                      <strong>Slots:</strong>{" "}
                      <span className="slots">
                        {Math.max(0, (supervisor.availableSlots || 0) - (supervisor.bookedSlots || 0))}{" "}
                        remaining
                      </span>
                    </p>
                  </div>
                  <button onClick={() => handleSelectSupervisor(supervisor)} className="select-btn">
                    Select Supervisor
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}