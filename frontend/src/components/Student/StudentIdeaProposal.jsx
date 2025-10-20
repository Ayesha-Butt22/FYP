import React, { useState } from "react";
import DashboardSectionHeader from "../Student/DashboardSectionHeader";
import { DropdownMultiSelect } from "../Admin/DropDowns.jsx";
import "./StudentIdeaProposal.css";
import ToastService from "../ToastService/ToastService.jsx";
import { Confirm } from "../ConfirmService/ConfirmService.jsx";
import { studentsSupervisorApi } from "../Api/StudentApi/StudentSupervisorApi.jsx";
import {GetTitle} from "../Api/AiService.jsx";

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
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpecialityChange = (value) => {
    setFormData((prev) => ({ ...prev, speciality: value }));
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
      if (response.count === 0) {
        ToastService.error("No supervisor available for current speciality!");
        return;
      }

      setSupervisors(response.data);
      setIsModalOpen(true);
    } catch (error) {
      ToastService.error("Error fetching supervisors. Please try again.");
    }
  };

  const handleSelectSupervisor = (supervisor) => {
    ToastService.success(
        `Supervisor "${supervisor.name}" selected successfully!`
    );
    setIsModalOpen(false);
  };

  return (

      <div>
       
<DashboardSectionHeader
              description="Propose your FYP project, describe it briefly, list the tools you plan
          to use, and choose your speciality. Once done, select a supervisor to
          continue."
            >
          Idea & Proposal
            </DashboardSectionHeader>

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
                  onChange={handleChange}
                  placeholder="Enter your project title"
                  required
                  className="flex-1"
              />
              <button
                  type="button"
                  className={`px-6 py-2.5 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                      loadingTitle
                          ? "bg-gradient-to-r from-blue-400 to-indigo-400 text-white cursor-not-allowed opacity-80"
                          : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700"
                  }`}
                  onClick={async () => {
                    if (!formData.title.trim()) {
                      ToastService.error("Please enter a project title first.");
                      return;
                    }
                    setLoadingTitle(true);
                    const suggestions = await GetTitle(formData.title);
                    setLoadingTitle(false);
                    setAiSuggestions(suggestions);
                  }}
              >
                {loadingTitle ? (
                    <span className="flex items-center gap-2">
          AI Thinking...
        </span>
                ) : (
                    <span className="flex items-center gap-2">
            ✨ AI Suggest
          </span>
                )}
              </button>
            </div>

            {aiSuggestions.length > 0 && (
                <div className="mt-4 p-5 border-2 border-indigo-200 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-30"></div>
                  <div className="relative z-10">
                    <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-transparent">
                      {aiSuggestions.map((title, i) => (
                          <div
                              key={i}
                              onClick={() => setFormData((prev) => ({ ...prev, title }))}
                              className="flex-shrink-0 px-5 py-3 bg-white rounded-xl shadow-md
                       border border-transparent hover:border-indigo-300
                       hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50
                       transition-all duration-300 transform hover:-translate-y-1
                       cursor-copy group"
                              style={{ cursor: "copy" }}
                          >
            <span className="text-gray-700 group-hover:text-indigo-700 font-medium flex items-center gap-2 whitespace-nowrap">
              <span className="text-indigo-500">💡</span>
              {title}
            </span>
                          </div>
                      ))}
                    </div>
                  </div>
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


        {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="modal-close-btn"
                >
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
                            <strong>Specialization:</strong>{" "}
                            {supervisor.specialization}
                          </p>
                          <p>
                            <strong>Slots:</strong>{" "}
                            <span className="slots">
                        {supervisor.availableSlots - supervisor.bookedSlots}{" "}
                              remaining
                      </span>
                          </p>
                        </div>
                        <button
                            onClick={() => handleSelectSupervisor(supervisor)}
                            className="select-btn"
                        >
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
