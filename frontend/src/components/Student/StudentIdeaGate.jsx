import React, { useState, useEffect } from "react";
import IdeaProposalForm from "./IdeaProposalForm";
import StudentDashboard from "./StudentDashboard"; 

export default function StudentIdeaGate() {
  const [ideaSubmitted, setIdeaSubmitted] = useState(null); 

  useEffect(() => {
    
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