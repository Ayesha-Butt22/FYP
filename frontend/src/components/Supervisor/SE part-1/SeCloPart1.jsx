import React, { useState } from "react";
import "./se-clo-part-1.css";
import ToastService from "../../ToastService/ToastService.jsx";

const loData = [
  {
    id: "lo1",
    title: "FYP-LO1",
    maxMarks: 10,
    description: "Demonstrate knowledge of mathematics, science, and software engineering fundamentals and processes.",
    options: [
      { val: 2,  label: "Poor understanding of basic software engineering concepts.",      range: "0–4 Marks"  },
      { val: 5,  label: "Understanding of basic software engineering is satisfactory.",    range: "5 Marks"    },
      { val: 7,  label: "Good understanding of basic software engineering.",               range: "7 Marks"    },
      { val: 8,  label: "Excellent understanding of basic software engineering.",          range: "8 Marks"    },
      { val: 10, label: "Outstanding understanding of basic software engineering.",        range: "10 Marks"   },
    ],
  },
  {
    id: "lo2",
    title: "FYP-LO2",
    maxMarks: 20,
    description: "Analyze a problem, identify and define software requirements appropriate to its solution.",
    options: [
      { val: 4,  label: "Lack of appropriate requirements and market survey not aligned to scope.", range: "0–8 Marks"  },
      { val: 10, label: "Requirements partially aligned with project scope.",                       range: "10 Marks"   },
      { val: 14, label: "Requirements gathered through appropriate elicitation techniques.",        range: "14 Marks"   },
      { val: 16, label: "Excellent requirement elicitation techniques aligned with scope.",         range: "16 Marks"   },
      { val: 20, label: "Outstanding requirement elicitation fully aligned with project scope.",    range: "20 Marks"   },
    ],
  },
  {
    id: "lo3",
    title: "FYP-LO3",
    maxMarks: 20,
    description: "Design and implement software engineering solutions for complex problems.",
    options: [
      { val: 4,  label: "Designs not according to requirements.",          range: "0–8 Marks"  },
      { val: 10, label: "Designs aligned with requirements.",              range: "10 Marks"   },
      { val: 14, label: "Good designs aligned with requirements.",         range: "14 Marks"   },
      { val: 16, label: "Excellent designs according to requirements.",    range: "16 Marks"   },
      { val: 20, label: "Outstanding designs according to requirements.",  range: "20 Marks"   },
    ],
  },
  {
    id: "lo4",
    title: "FYP-LO4",
    maxMarks: 10,
    description: "Evaluate a software engineering solution and conduct experiments.",
    options: [
      { val: 2,  label: "Software Quality Engineering and GUI with backend poorly applied.", range: "0–4 Marks" },
      { val: 5,  label: "Satisfactory application of Software Quality Engineering and GUI.", range: "5 Marks"   },
      { val: 7,  label: "Good application of Software Quality Engineering and GUI.",         range: "7 Marks"   },
      { val: 8,  label: "Excellent application of Software Quality Engineering and GUI.",    range: "8 Marks"   },
      { val: 10, label: "Outstanding application of Software Quality Engineering and GUI.",  range: "10 Marks"  },
    ],
  },
  {
    id: "lo5",
    title: "FYP-LO5",
    maxMarks: 15,
    description: "Apply appropriate techniques and modern software engineering tools.",
    options: [
      { val: 1.5, label: "Poor techniques and no appropriate tools used.",              range: "0–3 Marks" },
      { val: 6,   label: "Techniques partially satisfactory but no tools used.",        range: "6 Marks"   },
      { val: 9,   label: "Good techniques applied but tools not appropriate.",          range: "9 Marks"   },
      { val: 12,  label: "Techniques and tools used excellently.",                      range: "12 Marks"  },
      { val: 15,  label: "Techniques and tools used outstandingly.",                    range: "15 Marks"  },
    ],
  },
  {
    id: "lo6",
    title: "FYP-LO6",
    maxMarks: 5,
    description: "Work effectively in a team to accomplish a goal (Version Control).",
    options: [
      { val: 1, label: "Poor team work.",            range: "1 Mark"  },
      { val: 2, label: "Team work is satisfactory.", range: "2 Marks" },
      { val: 3, label: "Good team work.",             range: "3 Marks" },
      { val: 4, label: "Excellent team work.",        range: "4 Marks" },
      { val: 5, label: "Outstanding team working.",   range: "5 Marks" },
    ],
  },
  {
    id: "lo7",
    title: "FYP-LO7",
    maxMarks: 10,
    description: "Communicate effectively on complex engineering activities and presentations.",
    options: [
      { val: 2,  label: "Poor communication skills.",              range: "0–4 Marks" },
      { val: 5,  label: "Communication skills are satisfactory.",  range: "5 Marks"   },
      { val: 7,  label: "Good communication skills.",              range: "7 Marks"   },
      { val: 8,  label: "Excellent communication skills.",         range: "8 Marks"   },
      { val: 10, label: "Outstanding communication skills.",       range: "10 Marks"  },
    ],
  },
  {
    id: "lo8",
    title: "FYP-LO8",
    maxMarks: 10,
    description: "Demonstrate knowledge of project management principles and techniques.",
    options: [
      { val: 2,  label: "Poor knowledge of project management principles.",         range: "0–4 Marks" },
      { val: 5,  label: "Knowledge is satisfactory.",                               range: "5 Marks"   },
      { val: 7,  label: "Good knowledge of project management principles.",         range: "7 Marks"   },
      { val: 8,  label: "Excellent knowledge of project management principles.",    range: "8 Marks"   },
      { val: 10, label: "Outstanding knowledge of project management principles.",  range: "10 Marks"  },
    ],
  },
];

const LEVEL_LABELS = ["Poor", "Normal", "Good", "Excellent", "Outstanding"];

const SeCloPart1 = ({ onMarksSubmit }) => {
  const [isOpen, setIsOpen]               = useState(false);
  const [isSubmitted, setIsSubmitted]     = useState(false);
  const [selectedMarks, setSelectedMarks] = useState({});
  const [total, setTotal]                 = useState(0);

  const openModal  = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleChange = (loId, value) => {
    const updated = { ...selectedMarks, [loId]: parseFloat(value) };
    setSelectedMarks(updated);
    setTotal(Object.values(updated).reduce((a, v) => a + v, 0));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (Object.keys(selectedMarks).length < loData.length) {
      ToastService.warning("Please evaluate all 8 Learning Objectives (LOs) before submitting.");
      return;
    }
    setIsSubmitted(true);
    setIsOpen(false);
    if (onMarksSubmit) onMarksSubmit(selectedMarks, total);
  };

  const evaluated = Object.keys(selectedMarks).length;
  const progress  = (evaluated / loData.length) * 100;

  return (
    <>
      {isSubmitted ? (
        <div className="scp1-submitted-badge">
          <span className="scp1-check">✓</span>
          Submitted &nbsp;—&nbsp; {total} / 100 Marks
        </div>
      ) : (
        <button className="scp1-open-btn" onClick={openModal}>
          Open Evaluation Form
        </button>
      )}

      {isOpen && (
        <div
          className="scp1-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="scp1-modal-box">

            {/* ── HEADER ── */}
            <div className="scp1-header">
              <div className="scp1-header-left">
                <div className="scp1-header-tag">SE · Part 1</div>
                <h2 className="scp1-title">FYP Rubric Evaluation Form</h2>
              </div>
              <div className="scp1-header-right">
                <div className="scp1-progress-wrap">
                  <span className="scp1-progress-text">{evaluated}/{loData.length} LOs evaluated</span>
                  <div className="scp1-progress-bar">
                    <div className="scp1-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="scp1-total-top">
                  Total: <strong>{total}</strong> / 100
                </div>
                <button 
                  type="button" 
                  className="scp1-clear-btn" 
                  onClick={() => { setSelectedMarks({}); setTotal(0); }}
                  title="Clear all selections"
                >
                  Clear
                </button>
                <button type="button" className="scp1-submit" onClick={handleSubmit}>
                  Submit
                </button>
                <button type="button" className="scp1-close" onClick={closeModal} aria-label="Close">
                  &#10005;
                </button>
              </div>
            </div>

            {/* ── COLOR LEGEND STRIP ── */}
            <div className="scp1-legend">
              <span className="scp1-legend-label">Level Key:</span>
              {LEVEL_LABELS.map((label, idx) => (
                <div key={idx} className={`scp1-legend-item scp1-legend-item--${idx}`}>
                  <span className="scp1-legend-dot" />
                  {label}
                </div>
              ))}
            </div>

            {/* ── FORM ── */}
            <form onSubmit={handleSubmit}>
              <div className="scp1-form-content">
                {loData.map((lo) => {
                  const chosen = selectedMarks[lo.id];
                  return (
                    <div
                      className={`scp1-card ${chosen !== undefined ? "scp1-card--done" : ""}`}
                      key={lo.id}
                    >
                      {/* Card header row */}
                      <div className="scp1-card-header">
                        <div className="scp1-card-meta">
                          <span className="scp1-lo-badge">{lo.title}</span>
                          <span className="scp1-max-marks">{lo.maxMarks} Marks</span>
                        </div>
                        {chosen !== undefined && (
                          <div className={`scp1-chosen-pill scp1-chosen-pill--${lo.options.findIndex(o => o.val === chosen)}`}>
                            Selected: <strong>{chosen}</strong>
                          </div>
                        )}
                      </div>

                      <p className="scp1-card-desc">{lo.description}</p>

                      {/* Options */}
                      <div className="scp1-options">
                        {lo.options.map((opt, idx) => (
                          <label
                            key={idx}
                            className={`scp1-option scp1-option--${idx} ${
                              chosen === opt.val ? "scp1-option--selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={lo.id}
                              value={opt.val}
                              checked={chosen === opt.val}
                              onChange={(e) => handleChange(lo.id, e.target.value)}
                            />
                            <span className="scp1-level-tag">{LEVEL_LABELS[idx]}</span>
                            <span className="scp1-opt-label">{opt.label}</span>
                            <span className="scp1-opt-marks">{opt.range}</span>
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

export default SeCloPart1;