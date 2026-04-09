import React, { useState } from "react";
import "./se-clo-part-1.css";
import ToastService from "../../ToastService/ToastService.jsx";


const SeCloPart1 = ({ onMarksSubmit }) => {
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
    
    if (Object.keys(selectedMarks).length < 8) {
      ToastService.warning("Please evaluate all 8 Learning Objectives (LOs) before submitting.");
      return;
    }

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
                FYP Rubric Evaluation Form (SE - Part 1)
              </h2>

              <div className="cs1-header-right">
                <div className="cs1-total-top">
                  Total: {total} / 100
                </div>

                <button
                  type="submit"
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

            <form onSubmit={handleSubmit}>
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
                        <input type="radio" name="lo1" value={m}
                          onChange={(e) => handleChange("lo1", e.target.value)} />
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
                  <h3 className="h3">FYP-LO2 (20 Marks)</h3>
                  <p>
                    Analyze a problem, identify and define software requirements appropriate to its solution.
                  </p>
                  <div className="cs1-options">
                    {[4, 10, 14, 16, 20].map((m, i) => (
                      <label key={i}>
                        <input type="radio" name="lo2" value={m}
                          onChange={(e) => handleChange("lo2", e.target.value)} />
                        {m === 4 && "Lack of appropriate requirements and market survey not aligned to scope. (0-8 Marks)"}
                        {m === 10 && "Requirements partially aligned with project scope. (10 Marks)"}
                        {m === 14 && "Requirements gathered through appropriate elicitation techniques. (14 Marks)"}
                        {m === 16 && "Excellent requirement elicitation techniques aligned with scope. (16 Marks)"}
                        {m === 20 && "Outstanding requirement elicitation fully aligned with project scope. (20 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO3 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO3 (20 Marks)</h3>
                  <p>
                    Design and implement software engineering solutions for complex problems.
                  </p>
                  <div className="cs1-options">
                    {[4, 10, 14, 16, 20].map((m, i) => (
                      <label key={i}>
                        <input type="radio" name="lo3" value={m}
                          onChange={(e) => handleChange("lo3", e.target.value)} />
                        {m === 4 && "Designs not according to requirements. (0-8 Marks)"}
                        {m === 10 && "Designs aligned with requirements. (10 Marks)"}
                        {m === 14 && "Good designs aligned with requirements. (14 Marks)"}
                        {m === 16 && "Excellent designs according to requirements. (16 Marks)"}
                        {m === 20 && "Outstanding designs according to requirements. (20 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO4 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO4 (10 Marks)</h3>
                  <p>
                    Evaluate a software engineering solution and conduct experiments.
                  </p>
                  <div className="cs1-options">
                    {[2, 5, 7, 8, 10].map((m, i) => (
                      <label key={i}>
                        <input type="radio" name="lo4" value={m}
                          onChange={(e) => handleChange("lo4", e.target.value)} />
                        {m === 2 && "Software Quality Engineering and GUI with backend poorly applied. (0-4 Marks)"}
                        {m === 5 && "Satisfactory application of Software Quality Engineering and GUI. (5 Marks)"}
                        {m === 7 && "Good application of Software Quality Engineering and GUI. (7 Marks)"}
                        {m === 8 && "Excellent application of Software Quality Engineering and GUI. (8 Marks)"}
                        {m === 10 && "Outstanding application of Software Quality Engineering and GUI. (10 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO5 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO5 (15 Marks)</h3>
                  <p>
                    Apply appropriate techniques and modern software engineering tools.
                  </p>
                  <div className="cs1-options">
                    {[1.5, 6, 9, 12, 15].map((m, i) => (
                      <label key={i}>
                        <input type="radio" name="lo5" value={m}
                          onChange={(e) => handleChange("lo5", e.target.value)} />
                        {m === 1.5 && "Poor techniques and no appropriate tools used. (0-3 Marks)"}
                        {m === 6 && "Techniques partially satisfactory but no tools used. (6 Marks)"}
                        {m === 9 && "Good techniques applied but tools not appropriate. (9 Marks)"}
                        {m === 12 && "Techniques and tools used excellently. (12 Marks)"}
                        {m === 15 && "Techniques and tools used outstandingly. (15 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO6 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO6 (5 Marks)</h3>
                  <p>
                    Work effectively in a team to accomplish a goal (Version Control).
                  </p>
                  <div className="cs1-options">
                    {[1, 2, 3, 4, 5].map((m, i) => (
                      <label key={i}>
                        <input type="radio" name="lo6" value={m}
                          onChange={(e) => handleChange("lo6", e.target.value)} />
                        {m === 1 && "Poor team work. (1 Mark)"}
                        {m === 2 && "Team work is satisfactory. (2 Marks)"}
                        {m === 3 && "Good team work. (3 Marks)"}
                        {m === 4 && "Excellent team work. (4 Marks)"}
                        {m === 5 && "Outstanding team working. (5 Marks)"}
                      </label>
                    ))}
                  </div>
                </div>

                {/* LO7 */}
                <div className="cs1-card">
                  <h3 className="h3">FYP-LO7 (10 Marks)</h3>
                  <p>
                    Communicate effectively on complex engineering activities and presentations.
                  </p>
                  <div className="cs1-options">
                    {[2, 5, 7, 8, 10].map((m, i) => (
                      <label key={i}>
                        <input type="radio" name="lo7" value={m}
                          onChange={(e) => handleChange("lo7", e.target.value)} />
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
                  <p>
                    Demonstrate knowledge of project management principles and techniques.
                  </p>
                  <div className="cs1-options">
                    {[2, 5, 7, 8, 10].map((m, i) => (
                      <label key={i}>
                        <input type="radio" name="lo8" value={m}
                          onChange={(e) => handleChange("lo8", e.target.value)} />
                        {m === 2 && "Poor knowledge of project management principles. (0-4 Marks)"}
                        {m === 5 && "Knowledge is satisfactory. (5 Marks)"}
                        {m === 7 && "Good knowledge of project management principles. (7 Marks)"}
                        {m === 8 && "Excellent knowledge of project management principles. (8 Marks)"}
                        {m === 10 && "Outstanding knowledge of project management principles. (10 Marks)"}
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

export default SeCloPart1;