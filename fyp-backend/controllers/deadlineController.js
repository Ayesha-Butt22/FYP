//deadlineController.js
exports.getDeadLine = async (req, res) => {
    try {
        const { part } = req.query;

        const fyp1 = [
            {
                week: "Week 1",
                milestone: "Attend Orientation Seminar",
                submitTo: "Project Coordinator",
                deliverables: "Submit Project Team List (HARD COPY – Use Template-01)",
                templates:"Template-01 Project Team List  ",
                evaluations:"Nill",
                
            },
            {
                week: "Week 2",
                milestone: "Develop Project Ideas; Find a Supervisor",
                submitTo: "Project Coordinator",
                deliverables: "Submit Initial Proposal (HARD COPY – Use Template-02)",
                templates:"Template-02 Initial Proposal",
                evaluations:"Artifact Submission",
            },
            {
                week: "Week 3",
                milestone: "Nill",
                submitTo: "Nill",
                deliverables: "Nill",
                templates:"Nill",
                evaluations:"Nill",
                
            },
            {
                week: "Week 4",
                milestone: "Defend Proposal",
                submitTo: "Entire Faculty",
                deliverables: "Project Proposal Presentation (SOFT COPY – Use Template-03)",
                templates:"Template-03 Project Proposal Presentation",
                 evaluations:"Presentation Submission",

            },
            {
                week: "Week 5",
                milestone: "Nill",
                submitTo: "Nill",
                deliverables: "Nill",
                templates:"Nill",
                evaluations:"Nill",
                
            },
            {
                week: "Week 6",
                milestone: "Finalize Project Proposal",
                submitTo: "Project Coordinator",
                deliverables:
                    "Submit Project Proposal & Plan (Both SOFT & HARD COPY – Use Template-04)",
                templates:"Template-04 Project Proposal & Plan",
                     evaluations:"Artifact Submission",
            },
            {
                week: "Week 7",
                milestone: "Nill",
                submitTo: "Nill",
                deliverables: "Nill",
                templates:"Nill",
                evaluations:"Nill",
                
            },
            {
                week: "Week 8",
                milestone: "Nill",
                submitTo: "Nill",
                deliverables: "Nill",
                templates:"Nill",
                evaluations:"Nill",
                
            },
            {
                week: "Week 9",
                milestone: "Nill",
                submitTo: "Nill",
                deliverables: "Nill",
                templates:"Nill",
                evaluations:"Nill",
                
            },
            {
                week: "Week 10",
                milestone: "Nill",
                submitTo: "Nill",
                deliverables: "Nill",
                templates:"Nill",
                evaluations:"Nill",
                
            },
            {
                week: "Week 11",
                milestone: "Nill",
                submitTo: "Nill",
                deliverables: "Nill",
                templates:"Nill",
                evaluations:"Nill",
                
            },
            {
                week: "Week 12",
                milestone: "Nill",
                submitTo: "Nill",
                deliverables: "Nill",
                templates:"Nill",
                evaluations:"Nill",
                
            },
            {
                week: "Week 13",
                milestone: "Progress Presentation / Assessment",
                submitTo: "Exam Committee / Supervisor",
                deliverables:"Presentation (Use Template-07), Prototype, Project Report (SOFT COPY – First 5 Chapters – Use Template-05)",
                templates:"Template-07 Presentation, Template-05 Project Report",
                     evaluations:"Artifact Submission",
            },
        ];

        const fyp2 = [
            {
                week: "Week 11",
                milestone: "Submit Report",
                submitTo: "Project Coordinator",
                deliverables: "Complete Project Report (SOFT COPY – Use Template-05)",
                templates:"Template-05 Project Report",
                evaluations:"Artifact Submission",
            },
            {
                week: "Week 12",
                milestone: "Nill",
                submitTo: "Nill",
                deliverables: "Nill",
                templates:"Nill",
                evaluations:"Nill",
                
            },
            {
                week: "Week 13",
                milestone: "Final Evaluation",
                submitTo: "Exam Committee / Supervisor",
                deliverables:
                    "Final Presentation (Use Template-06), Full Working Demo",
                templates:"Template-06 Final Presentation",
                      evaluations:"presentation Submission",
            },
             
            {
                week: "Week 14",
                milestone: "Nill",
                submitTo: "Nill",
                deliverables: "Nill",
                templates:"Nill",
                evaluations:"Nill",
                
            },
            {
                week: "Week 15",
                milestone: "Open House",
                submitTo: "Industry, Faculty & Students",
                deliverables:
                    "Banners, Posters, Brochure, Project Report, Final Presentation (Use Template-06), Full Working Demo",
                templates:"Template-06 Final Presentation",
                    evaluations:"presentation Submission",
            },
           
    {
                week: "Week After Finals",
                milestone: "Submit Project",
                submitTo: "Project Coordinator",
                deliverables:
                    "Documentation (Hard Binding – 3 Copies), CD (Including Software – Source Code, Appendix in PDF Format)",
                templates:"Template-06 Final Presentation",
                    evaluations:"Artifact  and Code Submission ",
            },
        ];

        const data = part?.toLowerCase() === "fyp-2" ? fyp2 : fyp1;

        res.json({
            part: part?.toLowerCase() === "fyp-2" ? "FYP-II" : "FYP-I",
            totalMilestones: data.length,
            deadlines: data,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
