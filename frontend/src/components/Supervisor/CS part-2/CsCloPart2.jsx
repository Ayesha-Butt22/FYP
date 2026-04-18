import React, { useState } from "react";
import "./cs-clo-part-2.css";

const CsCloPart2 = ({ onMarksSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState({});
  const [total, setTotal] = useState(0);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleChange = (loName, value) => {
    const updatedMarks = { ...selectedMarks, [loName]: parseFloat(value) };
    setSelectedMarks(updatedMarks);
    setTotal(Object.values(updatedMarks).reduce((acc, val) => acc + val, 0));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setIsSubmitted(true);
    setIsOpen(false);
    if (onMarksSubmit) {
      onMarksSubmit(selectedMarks, total);
    }
  };

  const loData = [
    {
      id: "lo1",
      title: "FYP-LO1",
      max: 10,
      desc: "Demonstrate knowledge of mathematics, science, and computing appropriate to the discipline.",
      opts: [2, 5, 7, 8, 10],
      labels: [
        "Poor background knowledge related to disciplines.",
        "Background Knowledge is satisfactory.",
        "Good background knowledge.",
        "Excellent background knowledge.",
        "Outstanding background knowledge related to disciplines.",
      ],
      ranges: ["0-4 Marks", "5 Marks", "7 Marks", "8 Marks", "10 Marks"],
    },
    {
      id: "lo2",
      title: "FYP-LO2",
      max: 10,
      desc: "Analyze a problem, identify, and define computing requirements appropriate to its solution.",
      opts: [2, 5, 7, 8, 10],
      labels: [
        "Lack of gathering appropriate requirements / Problem statement not identified.",
        "Requirements partially aligned with project scope.",
        "Requirements aligned with project scope.",
        "Requirements clearly identified and aligned.",
        "Outstanding requirement elicitation aligned with scope.",
      ],
      ranges: ["0-4 Marks", "5 Marks", "7 Marks", "8 Marks", "10 Marks"],
    },
    {
      id: "lo3",
      title: "FYP-LO3",
      max: 15,
      desc: "Design and implement complex computing solutions for complex problems.",
      opts: [3.5, 8, 11, 13, 15],
      labels: [
        "Design not according to complex problem identified.",
        "Design aligned with complex problem identified.",
        "Good design aligned with complex problem.",
        "Excellent design according to complex problem.",
        "Outstanding design according to complex problem.",
      ],
      ranges: ["0-7 Marks", "8 Marks", "11 Marks", "13 Marks", "15 Marks"],
    },
    {
      id: "lo4",
      title: "FYP-LO4",
      max: 30,
      desc: "Apply mathematical foundations and algorithmic principles in modeling and system design.",
      opts: [6, 15, 21, 24, 30],
      labels: [
        "No knowledge of mathematical foundation and model not aligned.",
        "Satisfactory knowledge partially aligned.",
        "Good knowledge fully aligned.",
        "Excellent knowledge fully aligned.",
        "Outstanding knowledge fully aligned.",
      ],
      ranges: ["0-12 Marks", "15 Marks", "21 Marks", "24 Marks", "30 Marks"],
    },
    {
      id: "lo5",
      title: "FYP-LO5",
      max: 15,
      desc: "Apply modern tools, techniques and resources to solve complex problems.",
      opts: [3.5, 8, 11, 13, 15],
      labels: [
        "Poor techniques / resources and no appropriate tools.",
        "Techniques partially satisfactory.",
        "Good techniques applied.",
        "Techniques and tools used excellently.",
        "Outstanding performance using tools.",
      ],
      ranges: ["0-7 Marks", "8 Marks", "11 Marks", "13 Marks", "15 Marks"],
    },
    {
      id: "lo6",
      title: "FYP-LO6",
      max: 10,
      desc: "Work effectively in a team to accomplish a goal (Version Control).",
      opts: [2, 5, 7, 8, 10],
      labels: [
        "Poor teamwork.",
        "Team work is satisfactory.",
        "Good team work.",
        "Excellent team work.",
        "Outstanding teamwork.",
      ],
      ranges: ["0-4 Marks", "5 Marks", "7 Marks", "8 Marks", "10 Marks"],
    },
    {
      id: "lo7",
      title: "FYP-LO7",
      max: 10,
      desc: "Communicate effectively in oral and written form on complex computing tasks.",
      opts: [2, 5, 7, 8, 10],
      labels: [
        "Poor communication skills.",
        "Communication skills are satisfactory.",
        "Good communication skills.",
        "Excellent communication skills.",
        "Outstanding communication skills.",
      ],
      ranges: ["0-4 Marks", "5 Marks", "7 Marks", "8 Marks", "10 Marks"],
    },
  ];

  const LEVEL_LABELS = ["Poor", "Normal", "Good", "Excellent", "Outstanding"];

  return (
    <>
      {isSubmitted ? (
        <div className="csp2-submitted-badge">
          <span className="csp2-check">✓</span>
          Submitted &nbsp;—&nbsp; {total} / 100 Marks
        </div>
      ) : (
        <button className="csp2-open-btn" onClick={openModal}>
          Open CS Evaluation
        </button>
      )}

      {isOpen && (
        <div className="csp2-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="csp2-modal-box">
            {/* HEADER */}
            <div className="csp2-header">
              <div className="csp2-header-left">
                <div className="csp2-header-tag">CS · Part 2</div>
                <h2 className="csp2-title">FYP Rubric Evaluation Form</h2>
              </div>

              <div className="csp2-header-right">
                <div className="csp2-total-top">
                  Total: <strong>{total}</strong> / 100
                </div>

                <button
                  type="button"
                  className="csp2-submit"
                  onClick={handleSubmit}
                >
                  Submit
                </button>

                <button type="button" className="csp2-close" onClick={closeModal} aria-label="Close">
                  &#10005;
                </button>
              </div>
            </div>

            {/* LEVEL KEY */}
            <div className="csp2-legend">
              <span className="csp2-legend-label">Level Key:</span>
              {LEVEL_LABELS.map((label, idx) => (
                <div key={idx} className={`csp2-legend-item csp2-legend-item--${idx}`}>
                  <span className="csp2-legend-dot" />
                  {label}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="csp2-form-content">
                {loData.map((lo) => {
                  const chosen = selectedMarks[lo.id];
                  return (
                    <div className={`csp2-card ${chosen !== undefined ? "csp2-card--done" : ""}`} key={lo.id}>
                      <div className="csp2-card-header">
                        <div className="csp2-card-meta">
                          <span className="csp2-lo-badge">{lo.title}</span>
                          <span className="csp2-max-marks">{lo.max} Marks</span>
                        </div>
                        {chosen !== undefined && (
                          <div className={`csp2-chosen-pill csp2-chosen-pill--${lo.opts.indexOf(chosen)}`}>
                            Selected: <strong>{chosen}</strong>
                          </div>
                        )}
                      </div>
                      
                      <p className="csp2-card-desc">{lo.desc}</p>
                      
                      <div className="csp2-options">
                        {lo.opts.map((val, idx) => (
                          <label key={idx} className={`csp2-option csp2-option--${idx} ${chosen === val ? "csp2-option--selected" : ""}`}>
                            <input
                              type="radio"
                              name={lo.id}
                              value={val}
                              checked={chosen === val}
                              onChange={(e) => handleChange(lo.id, e.target.value)}
                              required
                            />
                            <span className="csp2-level-tag">{LEVEL_LABELS[idx]}</span>
                            <span className="csp2-opt-label">{lo.labels[idx]}</span>
                            <span className="csp2-opt-marks">{lo.ranges[idx]}</span>
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

export default CsCloPart2;