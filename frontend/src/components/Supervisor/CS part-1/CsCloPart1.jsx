import React, { useState } from "react";
import "./cs-clo-part-1.css";

const CsCloPart1 = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [marks, setMarks] = useState({
    lo1: 0,
    lo2: 0,
    lo3: 0,
    lo4: 0,
    lo5: 0,
    lo6: 0,
    lo7: 0,
  });

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMarks({
      ...marks,
      [name]: parseFloat(value),
    });
  };

  const total =
    marks.lo1 +
    marks.lo2 +
    marks.lo3 +
    marks.lo4 +
    marks.lo5 +
    marks.lo6 +
    marks.lo7;

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Form Submitted Successfully!");
  };

  return (
    <>
      <button className="open-btn" onClick={openModal}>
        Open CS CLO Part 1
      </button>

      {isOpen && (
        <div className="cs1-modal-overlay">
          <div className="cs1-modal-box">

            {/* HEADER */}
            <div className="cs1-header">
              <h2 className="h2">
                FYP Rubric Evaluation Form (CS - Part 1)
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

              {/* LO1 */}
              <div className="cs1-card">
                <h3 className="h3">FYP-LO1 (10 Marks)</h3>
                <p className="cs1-card p">
                  Demonstrate knowledge of mathematics, science, and computing appropriate to the discipline.
                </p>
                <div className="cs1-options">
                  <label ><input type="radio" name="lo1" value="2" onChange={handleChange}/> Poor background knowledge related to disciplines. (0-4 Marks)</label>
                  <label><input type="radio" name="lo1" value="5" onChange={handleChange}/> Background Knowledge is satisfactory. (5 Marks)</label>
                  <label><input type="radio" name="lo1" value="7" onChange={handleChange}/> Good background knowledge. (7 Marks)</label>
                  <label><input type="radio" name="lo1" value="8" onChange={handleChange}/> Excellent background knowledge. (8 Marks)</label>
                  <label><input type="radio" name="lo1" value="10" onChange={handleChange}/> Outstanding background knowledge related to disciplines. (10 Marks)</label>
                </div>
              </div>

              {/* LO2 */}
              <div className="cs1-card">
                <h3 className="h3">FYP-LO2 (15 Marks)</h3>
                 <p className="cs1-card p">
                  Analyze a problem, identify, and define computing requirements appropriate to its solution.
                </p>
                <div className="cs1-options">
                  <label><input type="radio" name="lo2" value="3" onChange={handleChange}/> Lack of gathering appropriate requirements / Problem statement not identified. (0-6 Marks)</label>
                  <label><input type="radio" name="lo2" value="8" onChange={handleChange}/> Requirements partially aligned with project scope. (8 Marks)</label>
                  <label><input type="radio" name="lo2" value="11" onChange={handleChange}/> Requirements fully aligned with project scope. (11 Marks)</label>
                  <label><input type="radio" name="lo2" value="13" onChange={handleChange}/> Requirements clearly identified and aligned. (13 Marks)</label>
                  <label><input type="radio" name="lo2" value="15" onChange={handleChange}/> Outstanding requirement elicitation aligned with scope. (15 Marks)</label>
                </div>
              </div>

              {/* LO3 */}
              <div className="cs1-card">
                <h3 className="h3">FYP-LO3 (20 Marks)</h3>
             <p className="cs1-card p">
                  Design and implement complex computing solutions for complex problems.
                </p>
                <div className="cs1-options">
                  <label><input type="radio" name="lo3" value="4" onChange={handleChange}/> Design not according to complex problem identified. (0-8 Marks)</label>
                  <label><input type="radio" name="lo3" value="10" onChange={handleChange}/> Design aligned with complex problem identified. (10 Marks)</label>
                  <label><input type="radio" name="lo3" value="14" onChange={handleChange}/> Good design aligned with complex problem. (14 Marks)</label>
                  <label><input type="radio" name="lo3" value="16" onChange={handleChange}/> Excellent design according to complex problem. (16 Marks)</label>
                  <label><input type="radio" name="lo3" value="20" onChange={handleChange}/> Outstanding design according to complex problem. (20 Marks)</label>
                </div>
              </div>

              {/* LO4 */}
              <div className="cs1-card">
                <h3 className="h3">FYP-LO4 (20 Marks)</h3>
                 <p className="cs1-card p">
                  Apply mathematical foundations and algorithmic principles in system design.
                </p>
                <div className="cs1-options">
                  <label><input type="radio" name="lo4" value="4" onChange={handleChange}/> No knowledge of mathematical foundation and model not aligned. (0-8 Marks)</label>
                  <label><input type="radio" name="lo4" value="10" onChange={handleChange}/> Satisfactory knowledge partially aligned. (10 Marks)</label>
                  <label><input type="radio" name="lo4" value="14" onChange={handleChange}/> Good knowledge fully aligned. (14 Marks)</label>
                  <label><input type="radio" name="lo4" value="16" onChange={handleChange}/> Excellent knowledge fully aligned. (16 Marks)</label>
                  <label><input type="radio" name="lo4" value="20" onChange={handleChange}/> Outstanding knowledge fully aligned. (20 Marks)</label>
                </div>
              </div>

              {/* LO5 */}
              <div className="cs1-card">
                <h3 className="h3">FYP-LO5 (10 Marks)</h3>
                 <p className="cs1-card p">
                  Apply modern tools, techniques and resources to solve complex problems.
                </p>
                <div className="cs1-options">
                  <label><input type="radio" name="lo5" value="2" onChange={handleChange}/> Poor techniques / resources and no appropriate tools. (0-4 Marks)</label>
                  <label><input type="radio" name="lo5" value="5" onChange={handleChange}/> Techniques partially satisfactory. (5 Marks)</label>
                  <label><input type="radio" name="lo5" value="7" onChange={handleChange}/> Good techniques applied. (7 Marks)</label>
                  <label><input type="radio" name="lo5" value="8" onChange={handleChange}/> Techniques and tools used excellently. (8 Marks)</label>
                  <label><input type="radio" name="lo5" value="10" onChange={handleChange}/> Outstanding performance using tools. (10 Marks)</label>
                </div>
              </div>

              {/* LO6 */}
              <div className="cs1-card">
                <h3 className="h3">FYP-LO6 (15 Marks)</h3>
                 <p className="cs1-card p">
                  Work effectively in a team to accomplish a goal (Version Control).
                </p>
                <div className="cs1-options">
                  <label><input type="radio" name="lo6" value="3" onChange={handleChange}/> Poor teamwork. (0-6 Marks)</label>
                  <label><input type="radio" name="lo6" value="8" onChange={handleChange}/> Team work is satisfactory. (8 Marks)</label>
                  <label><input type="radio" name="lo6" value="11" onChange={handleChange}/> Good team work. (11 Marks)</label>
                  <label><input type="radio" name="lo6" value="13" onChange={handleChange}/> Excellent team work. (13 Marks)</label>
                  <label><input type="radio" name="lo6" value="15" onChange={handleChange}/> Outstanding teamwork. (15 Marks)</label>
                </div>
              </div>

              {/* LO7 */}
              <div className="cs1-card">
                <h3 className="h3">FYP-LO7 (10 Marks)</h3>
                 <p className="cs1-card p">
                  Communicate effectively in oral and written form on complex computing tasks.
                </p>
                <div className="cs1-options">
                  <label ><input type="radio" name="lo7" value="2" onChange={handleChange}/> Poor communication skills. (0-4 Marks)</label>
                  <label><input type="radio" name="lo7" value="5" onChange={handleChange}/> Communication skills are satisfactory. (5 Marks)</label>
                  <label><input type="radio" name="lo7" value="7" onChange={handleChange}/> Good communication skills. (7 Marks)</label>
                  <label><input type="radio" name="lo7" value="8" onChange={handleChange}/> Excellent communication skills. (8 Marks)</label>
                  <label><input type="radio" name="lo7" value="10" onChange={handleChange}/> Outstanding communication skills. (10 Marks)</label>
                </div>
              </div>

              {/* <div className="cs1-total">
                Total Marks: {total} / 100
              </div> */}

              {/* <div className="cs1-footer">
                <button type="button" className="cs1-cancel" onClick={closeModal}>
                  Close
                </button>
                <button type="submit" className="cs1-submit">
                  Submit
                </button>
              </div> */}

            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CsCloPart1;