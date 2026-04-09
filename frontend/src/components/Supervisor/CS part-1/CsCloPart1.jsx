import React, { useState } from "react";
import "./cs-clo-part-1.css";
import ToastService from "../../ToastService/ToastService.jsx";

const CsCloPart1 = ({ onMarksSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [marks, setMarks] = useState({
    lo1: 0,
    lo2: 0,
    lo3: 0,
    lo4: 0,
    lo5: 0,
    lo6: 0,
    lo7: 0,
  });

  const checkValidation = () => {
    return Object.values(marks).every(m => m > 0);
  };

  const loData = [
    {
      id: "lo1",
      title: "FYP-LO1 (10 Marks)",
      desc: "Demonstrate knowledge of mathematics, science, and computing appropriate to the discipline.",
      options: [
        { label: "Poor background knowledge related to disciplines. (0-4 Marks)", value: 2 },
        { label: "Background Knowledge is satisfactory. (5 Marks)", value: 5 },
        { label: "Good background knowledge. (7 Marks)", value: 7 },
        { label: "Excellent background knowledge. (8 Marks)", value: 8 },
        { label: "Outstanding background knowledge related to disciplines. (10 Marks)", value: 10 },
      ],
    },
    {
      id: "lo2",
      title: "FYP-LO2 (15 Marks)",
      desc: "Analyze a problem, identify, and define computing requirements appropriate to its solution.",
      options: [
        { label: "Lack of gathering appropriate requirements / Problem statement not identified. (0-6 Marks)", value: 3 },
        { label: "Requirements partially aligned with project scope. (8 Marks)", value: 8 },
        { label: "Requirements fully aligned with project scope. (11 Marks)", value: 11 },
        { label: "Requirements clearly identified and aligned. (13 Marks)", value: 13 },
        { label: "Outstanding requirement elicitation aligned with scope. (15 Marks)", value: 15 },
      ],
    },
    {
      id: "lo3",
      title: "FYP-LO3 (20 Marks)",
      desc: "Design and implement complex computing solutions for complex problems.",
      options: [
        { label: "Design not according to complex problem identified. (0-8 Marks)", value: 4 },
        { label: "Design aligned with complex problem identified. (10 Marks)", value: 10 },
        { label: "Good design aligned with complex problem. (14 Marks)", value: 14 },
        { label: "Excellent design according to complex problem. (16 Marks)", value: 16 },
        { label: "Outstanding design according to complex problem. (20 Marks)", value: 20 },
      ],
    },
    {
      id: "lo4",
      title: "FYP-LO4 (20 Marks)",
      desc: "Apply mathematical foundations and algorithmic principles in system design.",
      options: [
        { label: "No knowledge of mathematical foundation and model not aligned. (0-8 Marks)", value: 4 },
        { label: "Satisfactory knowledge partially aligned. (10 Marks)", value: 10 },
        { label: "Good knowledge fully aligned. (14 Marks)", value: 14 },
        { label: "Excellent knowledge fully aligned. (16 Marks)", value: 16 },
        { label: "Outstanding knowledge fully aligned. (20 Marks)", value: 20 },
      ],
    },
    {
      id: "lo5",
      title: "FYP-LO5 (10 Marks)",
      desc: "Apply modern tools, techniques and resources to solve complex problems.",
      options: [
        { label: "Poor techniques / resources and no appropriate tools. (0-4 Marks)", value: 2 },
        { label: "Techniques partially satisfactory. (5 Marks)", value: 5 },
        { label: "Good techniques applied. (7 Marks)", value: 7 },
        { label: "Techniques and tools used excellently. (8 Marks)", value: 8 },
        { label: "Outstanding performance using tools. (10 Marks)", value: 10 },
      ],
    },
    {
      id: "lo6",
      title: "FYP-LO6 (15 Marks)",
      desc: "Work effectively in a team to accomplish a goal (Version Control).",
      options: [
        { label: "Poor teamwork. (0-6 Marks)", value: 3 },
        { label: "Team work is satisfactory. (8 Marks)", value: 8 },
        { label: "Good team work. (11 Marks)", value: 11 },
        { label: "Excellent team work. (13 Marks)", value: 13 },
        { label: "Outstanding teamwork. (15 Marks)", value: 15 },
      ],
    },
    {
      id: "lo7",
      title: "FYP-LO7 (10 Marks)",
      desc: "Communicate effectively in oral and written form on complex computing tasks.",
      options: [
        { label: "Poor communication skills. (0-4 Marks)", value: 2 },
        { label: "Communication skills are satisfactory. (5 Marks)", value: 5 },
        { label: "Good communication skills. (7 Marks)", value: 7 },
        { label: "Excellent communication skills. (8 Marks)", value: 8 },
        { label: "Outstanding communication skills. (10 Marks)", value: 10 },
      ],
    },
  ];

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
    if (e) e.preventDefault();

    if (!checkValidation()) {
      ToastService.warning("Please mark all Learning Objectives (LOs) before submitting.");
      return;
    }

    setIsSubmitted(true);
    setIsOpen(false);
    if (onMarksSubmit) {
      onMarksSubmit(marks, total);
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
                FYP Rubric Evaluation Form (CS - Part 1)
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
                {loData.map((lo) => (
                  <div key={lo.id} className="cs1-card">
                    <h3 className="h3">{lo.title}</h3>
                    <p className="cs1-card p">{lo.desc}</p>
                    <div className="cs1-options">
                      {lo.options.map((opt, optIndex) => (
                        <label key={optIndex}>
                          <input
                            type="radio"
                            name={lo.id}
                            value={opt.value}
                            checked={marks[lo.id] === opt.value}
                            onChange={handleChange}
                            required
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CsCloPart1;