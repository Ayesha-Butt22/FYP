import React, { useState, useEffect } from "react";
import IdeaProposalForm from "./IdeaProposalForm";
import StudentDashboard from "./StudentDashboard"; // Your sidebar/dashboard

export default function StudentIdeaGate() {
  const [ideaSubmitted, setIdeaSubmitted] = useState(null); // null=loading, false=not, true=yes

  useEffect(() => {
    // TODO: Replace with your real backend API
    fetch("/api/student/idea-status", { credentials: "include" })
      .then(res => res.json())
      .then(data => setIdeaSubmitted(data.submitted));
  }, []);

  if (ideaSubmitted === null) return <div style={{textAlign: "center", marginTop: 80}}>Loading...</div>;

  if (!ideaSubmitted) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f5f8fc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <IdeaProposalForm onSubmitSuccess={() => setIdeaSubmitted(true)} />
      </div>
    );
  }

  return <StudentDashboard />;
}