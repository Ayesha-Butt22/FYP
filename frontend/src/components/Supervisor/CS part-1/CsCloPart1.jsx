import React, { useState , useEffect } from "react";
import { createPortal } from "react-dom";
import "./cs-clo-part-1.css";

const CsCloPart1 = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    console.log("CsCloPart1 mounted");
    return () => console.log("CsCloPart1 unmounted");
  }, []);

  const openModal = () => setIsOpen(true);
  console.log(isOpen);
  const closeModal = () => setIsOpen(false);

  const handleChange = (loName, value) => {
    const updatedMarks = {
      ...selectedMarks,
      [loName]: parseFloat(value),
    };

    setSelectedMarks(updatedMarks);

    // Calculate total
    const sum = Object.values(updatedMarks).reduce(
      (acc, val) => acc + val,
      0
    );

    setTotal(sum);
  };

  return (
    <>
      <button className="open-btn" onClick={openModal}>
        Open CS CLO Part 1
      </button>

      {isOpen &&
          createPortal(
        <div className="modal123">
          <div className="modal-content">
            <div className="modal-header">
              <h2>FYP Rubric Evaluation Form (CS - Part 1)</h2>
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
                  <label>
                    <input
                      type="radio"
                      name="lo1"
                      value="2"
                      onChange={(e) =>
                        handleChange("lo1", e.target.value)
                      }
                    />
                    Poor background knowledge related to disciplines. (0-4 Marks)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="lo1"
                      value="5"
                      onChange={(e) =>
                        handleChange("lo1", e.target.value)
                      }
                    />
                    Background Knowledge is satisfactory. (5 Marks)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="lo1"
                      value="7"
                      onChange={(e) =>
                        handleChange("lo1", e.target.value)
                      }
                    />
                    Good background knowledge. (7 Marks)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="lo1"
                      value="8"
                      onChange={(e) =>
                        handleChange("lo1", e.target.value)
                      }
                    />
                    Excellent background knowledge. (8 Marks)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="lo1"
                      value="10"
                      onChange={(e) =>
                        handleChange("lo1", e.target.value)
                      }
                    />
                    Outstanding background knowledge related to disciplines. (10 Marks)
                  </label>
                </div>
              </div>

              {/* Repeat Same Pattern For LO2–LO7 */}

              {/* ---- LO2 ---- */}
              <div className="lo-card">
                <h3>FYP-LO2 (15 Marks)</h3>
                <p>
                  Analyze a problem, identify, and define computing requirements appropriate to its solution.
                </p>
                <div className="options">
                  {[3, 8, 11, 13, 15].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo2"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo2", e.target.value)
                        }
                      />
                      Option ({mark} Marks)
                    </label>
                  ))}
                </div>
              </div>

              {/* ---- LO3 ---- */}
              <div className="lo-card">
                <h3>FYP-LO3 (20 Marks)</h3>
                <p>
                  Design and implement complex computing solutions for complex problems.
                </p>
                <div className="options">
                  {[4, 10, 14, 16, 20].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo3"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo3", e.target.value)
                        }
                      />
                      Option ({mark} Marks)
                    </label>
                  ))}
                </div>
              </div>

              {/* ---- LO4 ---- */}
              <div className="lo-card">
                <h3>FYP-LO4 (20 Marks)</h3>
                <div className="options">
                  {[4, 10, 14, 16, 20].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo4"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo4", e.target.value)
                        }
                      />
                      Option ({mark} Marks)
                    </label>
                  ))}
                </div>
              </div>

              {/* ---- LO5 ---- */}
              <div className="lo-card">
                <h3>FYP-LO5 (10 Marks)</h3>
                <div className="options">
                  {[2, 5, 7, 8, 10].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo5"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo5", e.target.value)
                        }
                      />
                      Option ({mark} Marks)
                    </label>
                  ))}
                </div>
              </div>

              {/* ---- LO6 ---- */}
              <div className="lo-card">
                <h3>FYP-LO6 (15 Marks)</h3>
                <div className="options">
                  {[3, 8, 11, 13, 15].map((mark, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name="lo6"
                        value={mark}
                        onChange={(e) =>
                          handleChange("lo6", e.target.value)
                        }
                      />
                      Option ({mark} Marks)
                    </label>
                  ))}
                </div>
              </div>

              {/* ---- LO7 ---- */}
              <div className="lo-card">
                <h3>FYP-LO7 (10 Marks)</h3>
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
                      Option ({mark} Marks)
                    </label>
                  ))}
                </div>
              </div>

              <div className="total-box">
                Total Marks: {total} / 100
              </div>
            </form>
          </div>
        </div>,
              document.body
          )
      }
    </>
  );
};

export default CsCloPart1;