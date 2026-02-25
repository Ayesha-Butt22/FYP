//CsCloPart2.jsx
import React, { useState } from "react";
import "./cs-clo-part-2.css";

const CsCloPart2 = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState({});
  const [total, setTotal] = useState(0);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleChange = (loName, value) => {
    const updatedMarks = {
      ...selectedMarks,
      [loName]: parseFloat(value),
    };

    setSelectedMarks(updatedMarks);

    const sum = Object.values(updatedMarks).reduce(
      (acc, val) => acc + val,
      0
    );

    setTotal(sum);
  };

  return (
    <>
      <button className="open-btn" onClick={openModal}>
        Open CS CLO Part 2
      </button>

      {isOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>FYP Rubric Evaluation Form (CS - Part 2)</h2>
              <span className="close" onClick={closeModal}>
                &times;
              </span>
            </div>

            <form>
              {/* LO1 */}
              <div className="lo-card">
                <h3>FYP-LO1 (10 Marks)</h3>
                <p>
                  Demonstrate knowledge of mathematics, science, and computing
                  appropriate to the discipline.
                </p>
                <div className="options">
                  {[2, 5, 7, 8, 10].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo1"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo1", e.target.value)
                        }
                      />
                      {mark === 2 &&
                        "Poor background knowledge related to disciplines. (0-4 Marks)"}
                      {mark === 5 &&
                        "Background Knowledge is satisfactory. (5 Marks)"}
                      {mark === 7 && "Good background knowledge. (7 Marks)"}
                      {mark === 8 &&
                        "Excellent background knowledge. (8 Marks)"}
                      {mark === 10 &&
                        "Outstanding background knowledge related to disciplines. (10 Marks)"}
                    </label>
                  ))}
                </div>
              </div>

              {/* LO2 */}
              <div className="lo-card">
                <h3>FYP-LO2 (10 Marks)</h3>
                <p>
                  Analyze a problem, identify, and define computing requirements appropriate to its solution.
                </p>
                <div className="options">
                  {[2, 5, 7, 8, 10].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo2"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo2", e.target.value)
                        }
                      />
                      {mark === 2 &&
                        "Lack of gathering appropriate requirements / Problem statement not identified. (0-4 Marks)"}
                      {mark === 5 &&
                        "Requirements partially aligned with project scope. (5 Marks)"}
                      {mark === 7 &&
                        "Requirements aligned with project scope. (7 Marks)"}
                      {mark === 8 &&
                        "Requirements clearly identified and aligned. (8 Marks)"}
                      {mark === 10 &&
                        "Outstanding requirement elicitation aligned with scope. (10 Marks)"}
                    </label>
                  ))}
                </div>
              </div>

              {/* LO3 */}
              <div className="lo-card">
                <h3>FYP-LO3 (15 Marks)</h3>
                <p>
                  Design and implement complex computing solutions for complex problems.
                </p>
                <div className="options">
                  {[3.5, 8, 11, 13, 15].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo3"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo3", e.target.value)
                        }
                      />
                      {mark === 3.5 &&
                        "Design not according to complex problem identified. (0-7 Marks)"}
                      {mark === 8 &&
                        "Design aligned with complex problem identified. (8 Marks)"}
                      {mark === 11 &&
                        "Good design aligned with complex problem. (11 Marks)"}
                      {mark === 13 &&
                        "Excellent design according to complex problem. (13 Marks)"}
                      {mark === 15 &&
                        "Outstanding design according to complex problem. (15 Marks)"}
                    </label>
                  ))}
                </div>
              </div>

              {/* LO4 */}
              <div className="lo-card">
                <h3>FYP-LO4 (30 Marks)</h3>
                <p>
                  Apply mathematical foundations and algorithmic principles in modeling and system design.
                </p>
                <div className="options">
                  {[6, 15, 21, 24, 30].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo4"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo4", e.target.value)
                        }
                      />
                      {mark === 6 &&
                        "No knowledge of mathematical foundation and model not aligned. (0-12 Marks)"}
                      {mark === 15 &&
                        "Satisfactory knowledge partially aligned. (15 Marks)"}
                      {mark === 21 &&
                        "Good knowledge fully aligned. (21 Marks)"}
                      {mark === 24 &&
                        "Excellent knowledge fully aligned. (24 Marks)"}
                      {mark === 30 &&
                        "Outstanding knowledge fully aligned. (30 Marks)"}
                    </label>
                  ))}
                </div>
              </div>

              {/* LO5 */}
              <div className="lo-card">
                <h3>FYP-LO5 (15 Marks)</h3>
                <p>
                  Apply modern tools, techniques and resources to solve complex problems.
                </p>
                <div className="options">
                  {[3.5, 8, 11, 13, 15].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo5"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo5", e.target.value)
                        }
                      />
                      {mark === 3.5 &&
                        "Poor techniques / resources and no appropriate tools. (0-7 Marks)"}
                      {mark === 8 &&
                        "Techniques partially satisfactory. (8 Marks)"}
                      {mark === 11 && "Good techniques applied. (11 Marks)"}
                      {mark === 13 &&
                        "Techniques and tools used excellently. (13 Marks)"}
                      {mark === 15 &&
                        "Outstanding performance using tools. (15 Marks)"}
                    </label>
                  ))}
                </div>
              </div>

              {/* LO6 */}
              <div className="lo-card">
                <h3>FYP-LO6 (10 Marks)</h3>
                <p>
                  Work effectively in a team to accomplish a goal (Version Control).
                </p>
                <div className="options">
                  {[2, 5, 7, 8, 10].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo6"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo6", e.target.value)
                        }
                      />
                      {mark === 2 && "Poor teamwork. (0-4 Marks)"}
                      {mark === 5 && "Team work is satisfactory. (5 Marks)"}
                      {mark === 7 && "Good team work. (7 Marks)"}
                      {mark === 8 && "Excellent team work. (8 Marks)"}
                      {mark === 10 && "Outstanding teamwork. (10 Marks)"}
                    </label>
                  ))}
                </div>
              </div>

              {/* LO7 */}
              <div className="lo-card">
                <h3>FYP-LO7 (10 Marks)</h3>
                <p>
                  Communicate effectively in oral and written form on complex computing tasks.
                </p>
                <div className="options">
                  {[2, 5, 7, 8, 10].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo7"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo7", e.target.value)
                        }
                      />
                      {mark === 2 && "Poor communication skills. (0-4 Marks)"}
                      {mark === 5 &&
                        "Communication skills are satisfactory. (5 Marks)"}
                      {mark === 7 && "Good communication skills. (7 Marks)"}
                      {mark === 8 &&
                        "Excellent communication skills. (8 Marks)"}
                      {mark === 10 &&
                        "Outstanding communication skills. (10 Marks)"}
                    </label>
                  ))}
                </div>
              </div>

              <div className="total-box">
                Total Marks: {total.toFixed(1)} / 100
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CsCloPart2;