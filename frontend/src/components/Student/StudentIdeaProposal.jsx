import React, { useEffect, useState } from "react";
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

  // groupId stored in localStorage earlier in your flow. This must be the Group _id (24 hex) for create to work.
  const groupId = localStorage.getItem("groupId") || null;

  const [existingProposal, setExistingProposal] = useState(null);
  const [checkingProposal, setCheckingProposal] = useState(false);
  const [selectingSupervisor, setSelectingSupervisor] = useState(false);

  // Helper: is this a valid 24-hex ObjectId string?
  const looksLikeObjectId = (id) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

  // Check for existing proposal for this group (runs on mount & when groupId changes)
  useEffect(() => {
    if (!groupId) {
      setExistingProposal(null);
      return;
    }

    let mounted = true;
    const checkExistingProposal = async () => {
      setCheckingProposal(true);
      try {
        console.debug("[StudentIdeaProposal] checking existing proposal for groupId:", groupId);
        const resp = await fetch(`http://localhost:5000/api/proposals/${encodeURIComponent(groupId)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!mounted) return;

        if (resp.ok) {
          const data = await resp.json();
          // controller returns array; take first
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
            setSubmissionResult("alreadySubmitted");
            // set selectedSupervisor if already assigned
            if (p.projectSupervisor) {
              setSelectedSupervisor({ name: p.projectSupervisor, email: p.projectSupervisor });
            }
            ToastService.success("Existing proposal loaded");
          } else {
            setExistingProposal(null);
            setSubmissionResult(null);
          }
        } else {
          if (resp.status === 404) {
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
        console.error("[StudentIdeaProposal] checkExistingProposal error:", err);
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
      const response = await studentsSupervisorApi.getSupervisorOnSpeciality(formData.speciality);
      if (!response || response.count === 0 || !Array.isArray(response.data) || response.data.length === 0) {
        setSubmissionResult("not-selected");
        ToastService.error("No supervisor available for current speciality!");
        return;
      }

      setSupervisors(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("[StudentIdeaProposal] checkSpeciality error:", error);
      ToastService.error("Error fetching supervisors. Please try again.");
    }
  };

  // Persist selection to backend so supervisor sees it
  const handleSelectSupervisor = async (supervisor) => {
    setIsModalOpen(false);
    setSelectingSupervisor(true);

    // Basic client-side validation: ensure we have a valid groupId to send
    if (!groupId || !looksLikeObjectId(groupId)) {
      ToastService.error("Group ID missing or invalid. Create your group first (groupId must be backend Group _id).");
      setSelectingSupervisor(false);
      return;
    }

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      // If an existing proposal exists -> update it with supervisor & mark submitted
      if (existingProposal && existingProposal._id) {
        console.debug("[StudentIdeaProposal] updating existing proposal id:", existingProposal._id);
        const resp = await fetch(
          `http://localhost:5000/api/proposals/${encodeURIComponent(existingProposal._id)}/review`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              projectStatus: 1, // submitted
              projectSupervisorComments: `Student selected supervisor ${supervisor.name || supervisor.email || ""}`,
              projectSupervisor: supervisor.email || supervisor._id || supervisor.name,
            }),
          }
        );

        const respJson = await resp.json().catch(() => null);
        if (!resp.ok) {
          console.error("[StudentIdeaProposal] review update failed:", resp.status, respJson);
          // show backend message (structured)
          if (respJson && respJson.missingFields) {
            ToastService.error(respJson.error || "Required fields missing: " + respJson.missingFields.join(", "));
          } else {
            ToastService.error(respJson?.error || "Failed to update existing proposal.");
          }
          setSelectingSupervisor(false);
          return;
        }

        // Some backends may require updating the document's projectSupervisor field via a separate route.
        // Attempt a safe second update (ignore failures).
        try {
          await fetch(`http://localhost:5000/api/proposals/${encodeURIComponent(existingProposal._id)}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              projectSupervisor: supervisor.email || supervisor._id || supervisor.name,
              projectStatus: 1,
            }),
          });
        } catch (e) {
          console.warn("[StudentIdeaProposal] optional second update failed:", e);
        }

        setSelectedSupervisor(supervisor);
        setSubmissionResult("selected");
        setExistingProposal((prev) => ({ ...(prev || {}), projectSupervisor: supervisor.email || supervisor.name, projectStatus: 1 }));
        ToastService.success(`Supervisor ${supervisor.name || supervisor.email} selected and proposal updated.`);
        setSelectingSupervisor(false);
        return;
      }

      // No existing proposal -> create new proposal and assign supervisor
      const payload = {
        groupId: groupId,
        projectTitle: formData.title,
        projectDescription: formData.description,
        projectTools: formData.tools,
        specialization: Array.isArray(formData.speciality) ? formData.speciality[0] : formData.speciality,
        projectSupervisor: supervisor.email || supervisor._id || supervisor.name,
        projectStatus: 1, // submitted
      };

      console.debug("[StudentIdeaProposal] creating proposal payload:", payload);

      // Use the registered backend route: POST /api/proposals/submit
      const createResp = await fetch("http://localhost:5000/api/proposals/submit", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      // parse JSON safely
      const createJson = await createResp.json().catch(() => null);
      if (!createResp.ok) {
        console.error("[StudentIdeaProposal] create proposal failed:", createResp.status, createJson);
        if (createJson && createJson.missingFields) {
          // show backend Urdu message plus missing fields list
          ToastService.error(createJson.error || "groupId, projectTitle aur projectDescription zaroori hain");
          console.warn("Missing fields from backend:", createJson.missingFields);
        } else {
          ToastService.error(createJson?.error || "Failed to create proposal.");
        }
        setSelectingSupervisor(false);
        return;
      }

      // created may be wrapper { success, message, proposal } — handle both shapes
      const proposalObj = (createJson && createJson.proposal) ? createJson.proposal : createJson;
      setSelectedSupervisor(supervisor);
      setSubmissionResult("selected");
      setExistingProposal(proposalObj || createJson);
      ToastService.success(`Supervisor ${supervisor.name || supervisor.email} selected and proposal submitted.`);
      setSelectingSupervisor(false);
    } catch (err) {
      console.error("Error selecting supervisor:", err);
      ToastService.error("Network error while assigning supervisor.");
      setSelectingSupervisor(false);
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
    } catch (err) {
      console.error("[StudentIdeaProposal] GetTitle error:", err);
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

      {submissionResult === "selected" ? (
        <div className="result-card success">
          <h2>Your project idea has been submitted to supervisor successfully</h2>
          <p>
            Congratulations — your idea has been sent to{" "}
            <strong>{selectedSupervisor?.name || selectedSupervisor?.email}</strong>. Now wait for supervisor action
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
                setSubmissionResult(null);
                setIsModalOpen(false);
              }}
            >
              Resubmit Idea
            </button>
          </div>
        </div>
      ) : (
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
                  <button onClick={() => handleSelectSupervisor(supervisor)} className="select-btn" disabled={selectingSupervisor}>
                    {selectingSupervisor ? "Assigning..." : "Select Supervisor"}
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