import React, { useState } from "react";
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

  // New states to represent submission result
  // null = no submission yet, "selected" = supervisor selected, "not-selected" = not found / rejected
  const [submissionResult, setSubmissionResult] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

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
  };

  const handleOpenSupervisorDialog = (e) => {
    e.preventDefault(); // prevent page reload

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

      {/* If submissionResult is set, show a single result card and hide the form */}
      {submissionResult === "selected" ? (
        <div className="result-card success">
          <h2>Your project idea has been selected</h2>
          <p>
            Congratulations — your idea has been matched and <strong>{selectedSupervisor?.name}</strong> has been selected as
            your supervisor.
          </p>
          <div className="result-actions">
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
        // Default: show the form exactly as before
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