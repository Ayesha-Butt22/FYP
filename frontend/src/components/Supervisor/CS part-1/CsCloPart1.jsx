import React, { useState } from "react";
import "./cs-clo-part-1.css";
import ToastService from "../../ToastService/ToastService.jsx";

const CsCloPart1 = ({ onMarksSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [marks, setMarks] = useState({});

  const loData = [
    {
      id: "lo1",
      title: "FYP-LO1",
      maxMarks: 10,
      desc: "Demonstrate knowledge of mathematics, science, and computing appropriate to the discipline.",
      options: [
        { label: "Poor background knowledge related to disciplines.", range: "0-4 Marks", value: 2 },
        { label: "Background Knowledge is satisfactory.", range: "5 Marks", value: 5 },
        { label: "Good background knowledge.", range: "7 Marks", value: 7 },
        { label: "Excellent background knowledge.", range: "8 Marks", value: 8 },
        { label: "Outstanding background knowledge related to disciplines.", range: "10 Marks", value: 10 },
      ],
    },
    {
      id: "lo2",
      title: "FYP-LO2",
      maxMarks: 15,
      desc: "Analyze a problem, identify, and define computing requirements appropriate to its solution.",
      options: [
        { label: "Lack of gathering appropriate requirements / Problem statement not identified.", range: "0-6 Marks", value: 3 },
        { label: "Requirements partially aligned with project scope.", range: "8 Marks", value: 8 },
        { label: "Requirements fully aligned with project scope.", range: "11 Marks", value: 11 },
        { label: "Requirements clearly identified and aligned.", range: "13 Marks", value: 13 },
        { label: "Outstanding requirement elicitation aligned with scope.", range: "15 Marks", value: 15 },
      ],
    },
    {
      id: "lo3",
      title: "FYP-LO3",
      maxMarks: 20,
      desc: "Design and implement complex computing solutions for complex problems.",
      options: [
        { label: "Design not according to complex problem identified.", range: "0-8 Marks", value: 4 },
        { label: "Design aligned with complex problem identified.", range: "10 Marks", value: 10 },
        { label: "Good design aligned with complex problem.", range: "14 Marks", value: 14 },
        { label: "Excellent design according to complex problem.", range: "16 Marks", value: 16 },
        { label: "Outstanding design according to complex problem.", range: "20 Marks", value: 20 },
      ],
    },
    {
      id: "lo4",
      title: "FYP-LO4",
      maxMarks: 20,
      desc: "Apply mathematical foundations and algorithmic principles in system design.",
      options: [
        { label: "No knowledge of mathematical foundation and model not aligned.", range: "0-8 Marks", value: 4 },
        { label: "Satisfactory knowledge partially aligned.", range: "10 Marks", value: 10 },
        { label: "Good knowledge fully aligned.", range: "14 Marks", value: 14 },
        { label: "Excellent knowledge fully aligned.", range: "16 Marks", value: 16 },
        { label: "Outstanding knowledge fully aligned.", range: "20 Marks", value: 20 },
      ],
    },
    {
      id: "lo5",
      title: "FYP-LO5",
      maxMarks: 10,
      desc: "Apply modern tools, techniques and resources to solve complex problems.",
      options: [
        { label: "Poor techniques / resources and no appropriate tools.", range: "0-4 Marks", value: 2 },
        { label: "Techniques partially satisfactory.", range: "5 Marks", value: 5 },
        { label: "Good techniques applied.", range: "7 Marks", value: 7 },
        { label: "Techniques and tools used excellently.", range: "8 Marks", value: 8 },
        { label: "Outstanding performance using tools.", range: "10 Marks", value: 10 },
      ],
    },
    {
      id: "lo6",
      title: "FYP-LO6",
      maxMarks: 15,
      desc: "Work effectively in a team to accomplish a goal (Version Control).",
      options: [
        { label: "Poor teamwork.", range: "0-6 Marks", value: 3 },
        { label: "Team work is satisfactory.", range: "8 Marks", value: 8 },
        { label: "Good team work.", range: "11 Marks", value: 11 },
        { label: "Excellent team work.", range: "13 Marks", value: 13 },
        { label: "Outstanding teamwork.", range: "15 Marks", value: 15 },
      ],
    },
    {
      id: "lo7",
      title: "FYP-LO7",
      maxMarks: 10,
      desc: "Communicate effectively in oral and written form on complex computing tasks.",
      options: [
        { label: "Poor communication skills.", range: "0-4 Marks", value: 2 },
        { label: "Communication skills are satisfactory.", range: "5 Marks", value: 5 },
        { label: "Good communication skills.", range: "7 Marks", value: 7 },
        { label: "Excellent communication skills.", range: "8 Marks", value: 8 },
        { label: "Outstanding communication skills.", range: "10 Marks", value: 10 },
      ],
    },
  ];

  const LEVEL_LABELS = ["Poor", "Normal", "Good", "Excellent", "Outstanding"];

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleChange = (loId, value) => {
    setMarks({ ...marks, [loId]: parseFloat(value) });
  };

  const total = Object.values(marks).reduce((acc, val) => acc + val, 0);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (Object.keys(marks).length < loData.length) {
      ToastService.warning(
        `Please evaluate all ${loData.length} Learning Objectives (LOs) before submitting.`
      );
      return;
    }
    setIsSubmitted(true);
    setIsOpen(false);
    if (onMarksSubmit) {
      onMarksSubmit(marks, total);
    }
  };

  const evaluatedCount = Object.keys(marks).length;

  return (
    <>
      {isSubmitted ? (
        <div className="csp1-submitted-badge">
          <span className="csp1-check">✓</span>
          Submitted &nbsp;—&nbsp; {total} / 100 Marks
        </div>
      ) : (
        <button className="csp1-open-btn" onClick={openModal}>
          Open CS Evaluation Form
        </button>
      )}

      {isOpen && (
        <div className="csp1-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="csp1-modal-box">
            {/* HEADER */}
            <div className="csp1-header">
              <div className="csp1-header-left">
                <div className="csp1-header-tag">CS · Part 1</div>
                <h2 className="csp1-title">FYP Rubric Evaluation Form</h2>
              </div>

              <div className="csp1-header-right">
                <div className="csp1-total-top">
                  Total: <strong>{total}</strong> / 100
                </div>

                <button
                  type="button"
                  className="csp1-submit"
                  onClick={handleSubmit}
                >
                  Submit
                </button>

                <button type="button" className="csp1-close" onClick={closeModal} aria-label="Close">
                  &#10005;
                </button>
              </div>
            </div>

            {/* LEVEL KEY */}
            <div className="csp1-legend">
              <span className="csp1-legend-label">Level Key:</span>
              {LEVEL_LABELS.map((label, idx) => (
                <div key={idx} className={`csp1-legend-item csp1-legend-item--${idx}`}>
                  <span className="csp1-legend-dot" />
                  {label}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="csp1-form-content">
                {loData.map((lo) => {
                  const chosen = marks[lo.id];
                  return (
                    <div key={lo.id} className={`csp1-card ${chosen !== undefined ? "csp1-card--done" : ""}`}>
                      <div className="csp1-card-header">
                        <div className="csp1-card-meta">
                          <span className="csp1-lo-badge">{lo.title}</span>
                          <span className="csp1-max-marks">{lo.maxMarks} Marks</span>
                        </div>
                        {chosen !== undefined && (
                          <div className={`csp1-chosen-pill csp1-chosen-pill--${lo.options.findIndex(o => o.value === chosen)}`}>
                            Selected: <strong>{chosen}</strong>
                          </div>
                        )}
                      </div>
                      
                      <p className="csp1-card-desc">{lo.desc}</p>
                      
                      <div className="csp1-options">
                        {lo.options.map((opt, idx) => (
                          <label key={idx} className={`csp1-option csp1-option--${idx} ${chosen === opt.value ? "csp1-option--selected" : ""}`}>
                            <input
                              type="radio"
                              name={lo.id}
                              value={opt.value}
                              checked={chosen === opt.value}
                              onChange={(e) => handleChange(lo.id, e.target.value)}
                              required
                            />
                            <span className="csp1-level-tag">{LEVEL_LABELS[idx]}</span>
                            <span className="csp1-opt-label">{opt.label}</span>
                            <span className="csp1-opt-marks">{opt.range}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CsCloPart1;