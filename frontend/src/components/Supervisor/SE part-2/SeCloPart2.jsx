import React, { useState } from "react";
import "./se-clo-part-2.css";

const SeCloPart2 = ({ onMarksSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState({});
  const [total, setTotal] = useState(0);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleChange = (loName, value) => {
    const updated = {
      ...selectedMarks,
      [loName]: parseFloat(value),
    };

    setSelectedMarks(updated);

    const sum = Object.values(updated).reduce(
      (acc, val) => acc + val,
      0
    );

    setTotal(sum);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setIsSubmitted(true);
    setIsOpen(false);
    if (onMarksSubmit) {
      onMarksSubmit(selectedMarks, total);
    }
  };


  return (
    <>
      {isSubmitted ? (
        <div className="scp2-submitted-badge">
          <span className="scp2-check">✓</span>
          Submitted &nbsp;—&nbsp; {total} / 100 Marks
        </div>
      ) : (
        <button className="scp2-open-btn" onClick={openModal}>
          Open Evaluation
        </button>
      )}

      {isOpen && (
        <div className="scp2-modal-overlay">
          <div className="scp2-modal-box">

            {/* HEADER */}
            <div className="scp2-header">
              <div className="scp2-header-left">
                <div className="scp2-header-tag">SE · Part 2</div>
                <h2 className="scp2-title">FYP Rubric Evaluation Form</h2>
              </div>

              <div className="scp2-header-right">
                <div className="scp2-total-top">
                  Total: <strong>{total}</strong> / 100
                </div>

                <button
                  type="button"
                  className="scp2-submit"
                  onClick={handleSubmit}
                >
                  Submit
                </button>

                <button type="button" className="scp2-close" onClick={closeModal} aria-label="Close">
                  &#10005;
                </button>
              </div>
            </div>

            {/* ── COLOR LEGEND STRIP ── */}
            <div className="scp2-legend">
              <span className="scp2-legend-label">Level Key:</span>
              {["Poor", "Normal", "Good", "Excellent", "Outstanding"].map((label, idx) => (
                <div key={idx} className={`scp2-legend-item scp2-legend-item--${idx}`}>
                  <span className="scp2-legend-dot" />
                  {label}
                </div>
              ))}
            </div>


            <form onSubmit={handleSubmit}>
              <div className="scp2-form-content">
                {[
                  { id: "lo1", title: "FYP-LO1", max: 10, desc: "Demonstrate knowledge of mathematics, science, and software engineering fundamentals and processes.", opts: [2, 5, 7, 8, 10], labels: ["Poor understanding of basic software engineering concepts. (0-4 Marks)", "Understanding of basic software engineering is satisfactory. (5 Marks)", "Good understanding of basic software engineering. (7 Marks)", "Excellent understanding of basic software engineering. (8 Marks)", "Outstanding understanding of basic software engineering. (10 Marks)"], ranges: ["0-4 Marks", "5 Marks", "7 Marks", "8 Marks", "10 Marks"] },
                  { id: "lo2", title: "FYP-LO2", max: 10, desc: "Analyze a problem, identify and define software requirements appropriate to its solution.", opts: [2, 5, 7, 8, 10], labels: ["Lack of appropriate requirements and Market survey is not aligned. (0-4 Marks)", "Requirements partially aligned with project scope. (5 Marks)", "Requirements gathered through appropriate techniques. (7 Marks)", "Excellent requirement elicitation techniques. (8 Marks)", "Outstanding requirement elicitation techniques. (10 Marks)"], ranges: ["0-4 Marks", "5 Marks", "7 Marks", "8 Marks", "10 Marks"] },
                  { id: "lo3", title: "FYP-LO3", max: 10, desc: "Design and implement software engineering solutions for complex problems.", opts: [2, 5, 7, 8, 10], labels: ["Designs not according to requirements. (0-4 Marks)", "Designs aligned with the requirements. (5 Marks)", "Good designs aligned with the requirements. (7 Marks)", "Excellent designs according to requirements. (8 Marks)", "Outstanding designs according to requirements. (10 Marks)"], ranges: ["0-4 Marks", "5 Marks", "7 Marks", "8 Marks", "10 Marks"] },
                  { id: "lo4", title: "FYP-LO4", max: 20, desc: "Evaluate a software engineering solution and conduct experiments.", opts: [4, 10, 14, 16, 20], labels: ["Software Quality Engineering poorly applied. (0-8 Marks)", "Software Quality Engineering satisfactory. (10 Marks)", "Software Quality Engineering good. (14 Marks)", "Software Quality Engineering excellent. (16 Marks)", "Software Quality Engineering outstanding. (20 Marks)"], ranges: ["0-8 Marks", "10 Marks", "14 Marks", "16 Marks", "20 Marks"] },
                  { id: "lo5", title: "FYP-LO5", max: 15, desc: "Apply appropriate techniques and modern software engineering tools.", opts: [3.5, 8, 11, 13, 15], labels: ["Poor techniques and no tools used. (0-7 Marks)", "Techniques partially satisfactory but no tools. (8 Marks)", "Good techniques but tools not appropriate. (11 Marks)", "Techniques and tools used excellently. (13 Marks)", "Techniques and tools used outstandingly. (15 Marks)"], ranges: ["0-7 Marks", "8 Marks", "11 Marks", "13 Marks", "15 Marks"] },
                  { id: "lo6", title: "FYP-LO6", max: 15, desc: "Work effectively in a team to accomplish a goal.", opts: [3.5, 8, 11, 13, 15], labels: ["Poor team work. (0-7 Marks)", "Team Work is satisfactory. (8 Marks)", "Good team work. (11 Marks)", "Excellent team work. (13 Marks)", "Outstanding team work. (15 Marks)"], ranges: ["0-7 Marks", "8 Marks", "11 Marks", "13 Marks", "15 Marks"] },
                  { id: "lo7", title: "FYP-LO7", max: 10, desc: "Communicate effectively on complex engineering activities.", opts: [2, 5, 7, 8, 10], labels: ["Poor communication skills. (0-4 Marks)", "Communication skills are satisfactory. (5 Marks)", "Good communication skills. (7 Marks)", "Excellent communication skills. (8 Marks)", "Outstanding communication skills. (10 Marks)"], ranges: ["0-4 Marks", "5 Marks", "7 Marks", "8 Marks", "10 Marks"] },
                  { id: "lo8", title: "FYP-LO8", max: 10, desc: "Demonstrate knowledge of project management principles.", opts: [2, 5, 7, 8, 10], labels: ["Poor knowledge of project management. (0-4 Marks)", "Knowledge is satisfactory. (5 Marks)", "Good knowledge of project management. (7 Marks)", "Excellent knowledge of project management. (8 Marks)", "Outstanding knowledge of project management. (10 Marks)"], ranges: ["0-4 Marks", "5 Marks", "7 Marks", "8 Marks", "10 Marks"] },
                ].map((lo) => {
                  const chosen = selectedMarks[lo.id];
                  return (
                    <div className={`scp2-card ${chosen !== undefined ? "scp2-card--done" : ""}`} key={lo.id}>
                      <div className="scp2-card-header">
                        <div className="scp2-card-meta">
                          <span className="scp2-lo-badge">{lo.title}</span>
                          <span className="scp2-max-marks">{lo.max} Marks</span>
                        </div>
                        {chosen !== undefined && (
                          <div className={`scp2-chosen-pill scp2-chosen-pill--${lo.opts.indexOf(chosen)}`}>
                            Selected: <strong>{chosen}</strong>
                          </div>
                        )}
                      </div>
                      <p className="scp2-card-desc">{lo.desc}</p>
                      <div className="scp2-options">
                        {lo.opts.map((m, i) => (
                          <label key={i} className={`scp2-option scp2-option--${i} ${chosen === m ? "scp2-option--selected" : ""}`}>
                            <input
                              type="radio"
                              name={lo.id}
                              value={m}
                              checked={chosen === m}
                              onChange={(e) => handleChange(lo.id, e.target.value)}
                            />
                            <span className="scp2-level-tag">{["Poor", "Normal", "Good", "Excellent", "Outstanding"][i]}</span>
                            <span className="scp2-opt-label">{lo.labels[i]}</span>
                            <span className="scp2-opt-marks">{lo.ranges[i]}</span>
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

export default SeCloPart2;