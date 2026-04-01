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
        <div style={{ padding: "10px", backgroundColor: "#e8f5e9", borderRadius: "5px", border: "1px solid #4caf50", color: "#2e7d32", fontWeight: "bold", textAlign: "center", marginBottom: "15px" }}>
          Submitted: {total}/100 Marks
        </div>
      ) : (
        <button className="open-btn" onClick={openModal}>
          Open Evaluation
        </button>
      )}


      {isOpen && (
        <div className="cs1-modal-overlay">
          <div className="cs1-modal-box">

            {/* HEADER */}
            <div className="cs1-header">
              <h2 className="h2">
                FYP Rubric Evaluation Form (SE - Part 2)
              </h2>

              <div className="cs1-header-right">
                <div className="cs1-total-top">
                  Total: {total} / 100
                </div>

                <button
                  type="button"
                  className="cs1-submit"
                  onClick={handleSubmit}
                >
                  Submit
                </button>

                <span className="cs1-close" onClick={closeModal}>
                  &times;
                </span>
              </div>
            </div>


            <form>
              <div className="cs1-form-content">
                {/* LO1 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO1 (10 Marks)</h3>
                  <p>
                    Demonstrate knowledge of mathematics, science, and software engineering fundamentals and processes.
                  </p>
                  <div className="cs1-options">
                    {[2, 5, 7, 8, 10].map((m, i) => (
                      <label key={i}>
                        <input
                          type="radio"
                          name="lo1"
                          value={m}
                          onChange={(e) => handleChange("lo1", e.target.value)}
                        />
                        {m === 2 && "Poor understanding of basic software engineering concepts. (0-4 Marks)"}
                        {m === 5 && "Understanding of basic software engineering is satisfactory. (5 Marks)"}
                        {m === 7 && "Good understanding of basic software engineering. (7 Marks)"}
                        {m === 8 && "Excellent understanding of basic software engineering. (8 Marks)"}
                        {m === 10 && "Outstanding understanding of basic software engineering. (10 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO2 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO2 (10 Marks)</h3>
                  <p>
                    Analyze a problem, identify and define software requirements appropriate to its solution.
                  </p>
                  <div className="cs1-options">
                    {[2, 5, 7, 8, 10].map((m, i) => (
                      <label key={i}>
                        <input
                          type="radio"
                          name="lo2"
                          value={m}
                          onChange={(e) => handleChange("lo2", e.target.value)}
                        />
                        {m === 2 && "Lack of appropriate requirements and Market survey is not aligned to project scope. (0-4 Marks)"}
                        {m === 5 && "Requirements are partially aligned with project scope and market survey is aligned to project scope. (5 Marks)"}
                        {m === 7 && "Requirements are gathered through appropriate elicitation techniques and market survey is aligned to project scope. (7 Marks)"}
                        {m === 8 && "Excellent requirement elicitation techniques and market survey is aligned to project scope. (8 Marks)"}
                        {m === 10 && "Outstanding requirement elicitation techniques and market survey is 100% aligned to project scope. (10 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO3 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO3 (10 Marks)</h3>
                  <p>
                    Design and implement software engineering solutions for complex problems, components or processes to meet desired needs.
                  </p>
                  <div className="cs1-options">
                    {[2, 5, 7, 8, 10].map((m, i) => (
                      <label key={i}>
                        <input
                          type="radio"
                          name="lo3"
                          value={m}
                          onChange={(e) => handleChange("lo3", e.target.value)}
                        />
                        {m === 2 && "Designs, plans and proposed project is not according to requirements. (0-4 Marks)"}
                        {m === 5 && "Designs, plans and proposed project is all igened with the requirements. (5 Marks)"}
                        {m === 7 && "Designs, plans and proposed project is good and all igened with the requirements. (7 Marks)"}
                        {m === 8 && "Excellent designs, plans and proposed project is according to requirements. (8 Marks)"}
                        {m === 10 && "Outstanding designs, plans and proposed project is according to requirements. (10 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO4 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO4 (20 Marks)</h3>
                  <p>
                    Evaluate a software engineering solution in a methodical way design and, conduct experiments, analyze and interpret experimental data, and synthesize information to derive valid conclusions.
                  </p>
                  <div className="cs1-options">
                    {[4, 10, 14, 16, 20].map((m, i) => (
                      <label key={i}>
                        <input
                          type="radio"
                          name="lo4"
                          value={m}
                          onChange={(e) => handleChange("lo4", e.target.value)}
                        />
                        {m === 4 && "Software Quality Engineering and GUI along with Back-End functionality are poorly applied. (0-8 Marks)"}
                        {m === 10 && "Software Quality Engineering and GUI along with Back-End functionality is satisfactory. (10 Marks)"}
                        {m === 14 && "Software Quality Engineering and GUI along with Back-End functionality applied are good. (14 Marks)"}
                        {m === 16 && "Software Quality Engineering and GUI along with Back-End functionality are excellently applied. (16 Marks)"}
                        {m === 20 && "Software Quality Engineering and GUI along with Back-End functionality are oustandingly applied. (20 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO5 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO5 (15 Marks)</h3>
                  <p>Apply appropriate techniques, resources, and modern software engineering tools to solve complex problems.</p>
                  <div className="cs1-options">
                    {[3.5, 8, 11, 13, 15].map((m, i) => (
                      <label key={i}>
                        <input
                          type="radio"
                          name="lo5"
                          value={m}
                          onChange={(e) => handleChange("lo5", e.target.value)}
                        />
                        {m === 3.5 && "Poor techniques and no appropriate tools are used. (0-7 Marks)"}
                        {m === 8 && "Techniques are partially satisfactory but no tools are used. (8 Marks)"}
                        {m === 11 && "Good techniques are applied and tools are not appropriate. (11 Marks)"}
                        {m === 13 && "Techniques and tools are used excellently. (13 Marks)"}
                        {m === 15 && "Techniques and tools are used outstandingly. (15 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO6 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO6 (15 Marks)</h3>
                  <p>Work effectively in a team to accomplish a goal.</p>
                  <div className="cs1-options">
                    {[3.5, 8, 11, 13, 15].map((m, i) => (
                      <label key={i}>
                        <input
                          type="radio"
                          name="lo6"
                          value={m}
                          onChange={(e) => handleChange("lo6", e.target.value)}
                        />
                        {m === 3.5 && "Poor team work. (0-7 Marks)"}
                        {m === 8 && "Team Work is satisfactory. (8 Marks)"}
                        {m === 11 && "Good team work. (11 Marks)"}
                        {m === 13 && "Excellent team work. (13 Marks)"}
                        {m === 15 && "Outstanding team work. (15 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO7 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO7 (10 Marks)</h3>
                  <p>Communicate effectively on complex engineering activities and make effective presentations.</p>
                  <div className="cs1-options">
                    {[2, 5, 7, 8, 10].map((m, i) => (
                      <label key={i}>
                        <input
                          type="radio"
                          name="lo7"
                          value={m}
                          onChange={(e) => handleChange("lo7", e.target.value)}
                        />
                        {m === 2 && "Poor communication skills. (0-4 Marks)"}
                        {m === 5 && "Communication skills are satisfactory. (5 Marks)"}
                        {m === 7 && "Good communication skills. (7 Marks)"}
                        {m === 8 && "Excellent communication skills. (8 Marks)"}
                        {m === 10 && "Outstanding communication skills. (10 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO8 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO8 (10 Marks)</h3>
                  <p>Demonstrate knowledge of project management principles and techniques.</p>
                  <div className="cs1-options">
                    {[2, 5, 7, 8, 10].map((m, i) => (
                      <label key={i}>
                        <input
                          type="radio"
                          name="lo8"
                          value={m}
                          onChange={(e) => handleChange("lo8", e.target.value)}
                        />
                        {m === 2 && "Poor knowledge of project management principles and techniques. (0-4 Marks)"}
                        {m === 5 && "Knowledge of project management principles and techniques is satisfactory. (5 Marks)"}
                        {m === 7 && "Good knowledge of project management principles and techniques. (7 Marks)"}
                        {m === 8 && "Excellent knowledge of project management principles and techniques. (8 Marks)"}
                        {m === 10 && "Outstanding knowledge of project management principles and techniques. (10 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SeCloPart2;