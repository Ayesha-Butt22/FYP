import React, { useState } from "react";
import "./se-clo-part-2.css";

const SeCloPart2 = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <>
      <button className="open-btn" onClick={openModal}>
        Open SE CLO Part 2
      </button>

      {isOpen && (
        <div className="modal123">
          <div className="modal-content">

            <div className="modal-header">
              <h2>FYP Rubric Evaluation Form (SE - Part 2)</h2>
              <span className="close" onClick={closeModal}>
                &times;
              </span>
            </div>

            <form>

              {/* LO1 */}
              <div className="lo-card">
                <h3>FYP-LO1 (10 Marks)</h3>
                <p>
                  Demonstrate knowledge of mathematics, science, and software engineering fundamentals and processes.
                </p>
                <div className="options">
                  {[2,5,7,8,10].map((m,i)=>(
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo1"
                        value={m}
                        onChange={(e)=>handleChange("lo1", e.target.value)}
                      />
                      {m===2 && "Below Average (0-4 Marks)"}
                      {m===5 && "Average (5 Marks)"}
                      {m===7 && "Good (7 Marks)"}
                      {m===8 && "Excellent (8 Marks)"}
                      {m===10 && "Outstanding (10 Marks)"}
                    </label>
                  ))}
                </div>
              </div>

              {/* LO4 */}
              <div className="lo-card">
                <h3>FYP-LO4 (20 Marks)</h3>
                <p>
                  Evaluate a software engineering solution in a methodical way.
                </p>
                <div className="options">
                  {[4,10,14,16,20].map((m,i)=>(
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo4"
                        value={m}
                        onChange={(e)=>handleChange("lo4", e.target.value)}
                      />
                      {m===4 && "Below Average (0-8 Marks)"}
                      {m===10 && "Average (10 Marks)"}
                      {m===14 && "Good (14 Marks)"}
                      {m===16 && "Excellent (16 Marks)"}
                      {m===20 && "Outstanding (20 Marks)"}
                    </label>
                  ))}
                </div>
              </div>

              {/* LO5 */}
              <div className="lo-card">
                <h3>FYP-LO5 (15 Marks)</h3>
                <p>Apply appropriate techniques, resources and modern tools.</p>
                <div className="options">
                  {[3.5,8,11,13,15].map((m,i)=>(
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo5"
                        value={m}
                        onChange={(e)=>handleChange("lo5", e.target.value)}
                      />
                      {m===3.5 && "Below Average (0-7 Marks)"}
                      {m===8 && "Average (8 Marks)"}
                      {m===11 && "Good (11 Marks)"}
                      {m===13 && "Excellent (13 Marks)"}
                      {m===15 && "Outstanding (15 Marks)"}
                    </label>
                  ))}
                </div>
              </div>

              {/* LO6 */}
              <div className="lo-card">
                <h3>FYP-LO6 (15 Marks)</h3>
                <p>Work effectively in a team to accomplish a goal.</p>
                <div className="options">
                  {[3.5,8,11,13,15].map((m,i)=>(
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo6"
                        value={m}
                        onChange={(e)=>handleChange("lo6", e.target.value)}
                      />
                      {m===3.5 && "Below Average (0-7 Marks)"}
                      {m===8 && "Average (8 Marks)"}
                      {m===11 && "Good (11 Marks)"}
                      {m===13 && "Excellent (13 Marks)"}
                      {m===15 && "Outstanding (15 Marks)"}
                    </label>
                  ))}
                </div>
              </div>

              {/* LO7 */}
              <div className="lo-card">
                <h3>FYP-LO7 (10 Marks)</h3>
                <p>Communicate effectively on complex engineering activities.</p>
                <div className="options">
                  {[2,5,7,8,10].map((m,i)=>(
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo7"
                        value={m}
                        onChange={(e)=>handleChange("lo7", e.target.value)}
                      />
                      {m===2 && "Below Average (0-4 Marks)"}
                      {m===5 && "Average (5 Marks)"}
                      {m===7 && "Good (7 Marks)"}
                      {m===8 && "Excellent (8 Marks)"}
                      {m===10 && "Outstanding (10 Marks)"}
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

export default SeCloPart2;