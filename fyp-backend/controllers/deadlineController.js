// deadlineController.js

exports.getDeadLine = async (req, res) => {
  try {
    const { part } = req.query;

    // =========================
    // FYP – I (Part 1)  
    // =========================
    const fyp1 = [
      {
        week: "Week 1",
        milestone: "Attend Orientation Seminar",
        submitTo: "Project Coordinator",
        deliverables:
          "Submit Project Team List (Both SOFT & HARD COPY – Use Template-01)",
        templates: "Template-01 Project Team List",
        evaluations: "Artifact Submission",
      },
      {
        week: "Week 2",
        milestone: "Develop Project Ideas; Find a Supervisor",
        submitTo: "Project Coordinator",
        deliverables:
          "Submit Initial Proposal (HARD COPY – Use Template-02)",
        templates: "Template-02 Initial Proposal",
        evaluations: "Artifact Submission",
      },
      {
        week: "Week 4",
        milestone: "Proposal Presentation",
        submitTo: "Entire Faculty",
        deliverables:
          "Project Proposal Presentation (SOFT COPY – Use Template-03)",
        templates: "Template-03 Project Proposal Presentation",
        evaluations: "Presentation Submission",
      },
      {
        week: "Week 6",
        milestone: "Finalize Project Proposal",
        submitTo: "Project Coordinator",
        deliverables:
          "Submit Project Proposal & Plan (Both SOFT & HARD COPY – Use Template-04)",
        templates: "Template-04 Project Proposal & Plan",
        evaluations: "Artifact Submission",
      },
      {
        week: "Week 15",
        milestone: "Open House",
        submitTo: "Industry, Faculty & Students",
        deliverables:
          "Banners, Posters, Brochure, Story Board, Prototype, Project Report",
        templates: "Nill",
        evaluations: "Presentation Submission",
      },
      {
        week: "Week 16 ",
        milestone: "Immediately After Finals (Progress Presentation / Assessment) ",
        submitTo: "Exam Committee / Supervisor",
        deliverables:
          "Presentation (Use Template-07), Prototype, Project Report (SOFT COPY – First 5 Chapters – Use Template-05)",
        templates:
          "Template-07 Presentation, Template-05 Project Report",
        evaluations: "Presentation & Report Submission",
      },
    ];

    // =========================
    // FYP – II (Part 2) (Exact Image Structure)
    // =========================
    const fyp2 = [
      {
        week: "Week 13",
        milestone: "Submit Report",
        submitTo: "Project Coordinator",
        deliverables:
          "Complete Project Report (SOFT COPY – Use Template-05)",
        templates: "Template-05 Project Report",
        evaluations: "Artifact Submission",
      },
      {
        week: "Week 14",
        milestone: "Final Demo / Assessment",
        submitTo: "Exam Committee / Supervisor",
        deliverables:
          "Final Presentation (Use Template-06), Report (Use Template-05), Full Working Demo",
        templates:
          "Template-06 Final Presentation, Template-05 Project Report",
        evaluations: "Presentation & Demo Submission",
      },
      {
        week: "Week 15",
        milestone: "Open House",
        submitTo: "Industry, Faculty & Students",
        deliverables:
          "Banners, Posters, Brochure, Story Board, Prototype, Project Report, Complete Software System",
        templates: "Nill",
        evaluations: "Presentation Submission",
      },
      {
        week: "Week 16 ",
        milestone: "Immediately After Finals (Submit Project)",
        submitTo: "Project Coordinator",
        deliverables:
          "Documentation (Hard Binding – 3 Copies), CD (Including Software – Source Code, Appendix in PDF Format)",
        templates: "Nill",
        evaluations: "Artifact and Code Submission",
      },
    ];

    const isFyp2 = part?.toLowerCase() === "fyp-2";
    const data = isFyp2 ? fyp2 : fyp1;

    res.json({
      part: isFyp2 ? "FYP-II" : "FYP-I",
      totalMilestones: data.length,
      deadlines: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};