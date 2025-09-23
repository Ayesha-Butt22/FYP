import React, { useState } from "react";
import { toastService } from "../ToastService/ToastService";
import DashboardSectionHeader from "../Student/DashboardSectionHeader"
import "./StudentGroup.css";

const MAX_MEMBERS = 3;

export default function StudentGroup() {
  // Get user info from localStorage
  const currentUser = {
    name: localStorage.getItem("name") || "Ayesha",
    studentId: localStorage.getItem("studentId") || "48288",
    email: localStorage.getItem("email") || "48288@students.riphah.edu.pk"
  };

  // UI states
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([
    { name: currentUser.name, studentId: currentUser.studentId, email: currentUser.email, isLeader: true }
  ]);
  const [creating, setCreating] = useState(false);
  const [groupCreated, setGroupCreated] = useState(false);

  // Add new member row
  const handleAddMember = () => {
    if (members.length < MAX_MEMBERS)
      setMembers([...members, { name: "", studentId: "", email: "", isLeader: false }]);
  };

  // Remove member row
  const handleRemoveMember = idx => {
    setMembers(members.filter((_m, i) => i !== idx));
  };

  // Change input for members
  const handleMemberChange = (idx, field, value) => {
    setMembers(members.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  // Validation
  const canSave =
    groupName.trim() &&
    members.length >= 1 &&
    members.slice(1).every(
      m => m.name.trim() && m.studentId.trim() && m.email.trim()
    );

  // Save group (simulate backend)
  const handleSubmit = e => {
    e.preventDefault();
    setCreating(true);
    setTimeout(() => {
      setCreating(false);
      setGroupCreated(true);
      toastService.success("Group Created Successfully!", 2200);
    }, 900);
  };

  return (
    <>
      {/* Heading sirf uper dikhayenge */}
      <DashboardSectionHeader>My Group</DashboardSectionHeader>

      <div className="page-container" style={{display:"flex",justifyContent:"center",alignItems:"flex-start"}}>
        <div className="group-card" style={{
          width: 1090,
          maxWidth: "99vw",
          margin: "50px auto",
          padding: "54px 56px 52px 56px",
          background: "#fff"
        }}>
          {/* Show FORM if not created */}
          {!groupCreated && (
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="group-title" style={{
                fontSize:'2.1rem', fontWeight:900, marginBottom:28, textAlign:"left", marginLeft:8, letterSpacing:".7px"
              }}>
                Create Group
              </div>
              <div style={{
                margin:"0 0 11px 0", textAlign:"left", fontWeight:"bold", color:"#01337a", marginLeft:8, fontSize:"1.2rem"
              }}>
                Group Name
              </div>
              <input
                className="form-input"
                style={{
                  width:"100%",
                  fontSize:"1.22rem",
                  padding:"15px 18px",
                  borderRadius:10,
                  border:"1.7px solid #dbeafe",
                  marginBottom:30,
                  background:"#f8faff",
                  fontWeight:500,
                }}
                placeholder="e.g. Smart Attendance"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                required
              />

              <table style={{
                width:"100%",
                borderCollapse:"collapse",
                marginBottom:24,
                marginTop:36,
                background:"#f8fafb",
                borderRadius:13,
                overflow:"hidden",
                boxShadow:"0 1px 8px #01337a0c"
              }}>
                <thead>
                  <tr style={{background:"#f4f6fa"}}>
                    <th style={{textAlign:"left",color:"#01337a",fontWeight:900,fontSize:19,padding:"10px 8px", width:170}}>Group Members</th>
                    <th style={{textAlign:"left",color:"#01337a",fontWeight:900,fontSize:19,padding:"10px 8px", width:230}}>Name</th>
                    <th style={{textAlign:"left",color:"#01337a",fontWeight:900,fontSize:19,padding:"10px 8px", width:130}}>SAP ID</th>
                    <th style={{textAlign:"left",color:"#01337a",fontWeight:900,fontSize:19,padding:"10px 8px", width:320}}>Email</th>
                    <th style={{width:30}}></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Member 1 - always current user */}
                  <tr style={{background:"#e6f0ff"}}>
                    <td style={{padding:"9px 8px",fontWeight:900,color:"#2563eb"}}>Leader (You)</td>
                    <td style={{padding:"9px 6px",fontWeight:900, color:"#01337a"}}>{currentUser.name}</td>
                    <td style={{padding:"9px 6px",fontWeight:700}}>{currentUser.studentId}</td>
                    <td style={{padding:"9px 6px",fontWeight:700}}>{currentUser.email}</td>
                    <td></td>
                  </tr>
                  {/* Other members */}
                  {members.slice(1).map((m, idx) => (
                    <tr key={idx+1} style={{background:"#f8fafc"}}>
                      <td style={{padding:"8px 8px",fontWeight:700,color:"#01337a"}}>
                        Member {idx+2}
                      </td>
                      <td style={{padding:"7px 6px"}}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Name"
                          style={{width:180,fontSize:"1.15rem"}}
                          value={m.name}
                          onChange={e => handleMemberChange(idx+1, "name", e.target.value)}
                          required
                        />
                      </td>
                      <td style={{padding:"7px 6px"}}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="SAP ID"
                          style={{width:110,fontSize:"1.15rem"}}
                          value={m.studentId}
                          onChange={e => handleMemberChange(idx+1, "studentId", e.target.value)}
                          required
                        />
                      </td>
                      <td style={{padding:"7px 6px"}}>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="Email"
                          style={{width:260,fontSize:"1.15rem"}}
                          value={m.email}
                          onChange={e => handleMemberChange(idx+1, "email", e.target.value)}
                          required
                        />
                      </td>
                      <td style={{textAlign:"center"}}>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx+1)}
                          style={{
                            border:"none",
                            background:"none",
                            color:"#f43f5e",
                            fontSize:"1.33rem",
                            fontWeight:900,
                            cursor:"pointer",
                            padding:0
                          }}
                          title="Remove"
                        >×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add Member button */}
              {members.length < MAX_MEMBERS && (
                <button
                  type="button"
                  className="view-btn"
                  style={{
                    background:"#bcd0ee",
                    color:"#01337a",
                    fontWeight:700,
                    fontSize:"1.13rem",
                    width:160,
                    margin:"0 0 28px 0",
                    height:42,
                    borderRadius:10
                  }}
                  onClick={handleAddMember}
                >
                  + Add Member
                </button>
              )}

              {/* Centered Save Group button */}
              <div className="save-group-btn-center">
                <button
                  type="submit"
                  className="view-btn"
                  style={{
                    background:"#01337a",
                    color:"#fff",
                    fontWeight:900,
                    fontSize:"1.25rem",
                    width:260,
                    height:50,
                    letterSpacing:0.7,
                    borderRadius:12,
                    alignSelf:"center",
                    display: "block",
                  }}
                  disabled={!canSave || creating}
                >
                  {creating ? "Saving..." : "Save Group"}
                </button>
              </div>
            </form>
          )}

          {/* After group creation, show only table */}
          {groupCreated && (
            <>
              <div className="group-members-heading">
                Group Members
              </div>
              <table style={{
                width:"100%",
                borderCollapse:"collapse",
                marginBottom:8,
                marginTop:32,
                background:"#f8fafb",
                borderRadius:13,
                overflow:"hidden",
                boxShadow:"0 1px 8px #01337a0c"
              }}>
                <thead>
                  <tr style={{background:"#f4f6fa"}}>
                    <th style={{textAlign:"center", color:"#01337a",fontWeight:900, fontSize:22, padding:"14px 8px", width:230}}>Name</th>
                    <th style={{textAlign:"center", color:"#01337a",fontWeight:900, fontSize:22, padding:"14px 8px", width:130}}>SAP ID</th>
                    <th style={{textAlign:"center", color:"#01337a",fontWeight:900, fontSize:22, padding:"14px 8px", width:320}}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, idx) => (
                    <tr key={idx} style={{background: idx === 0 ? "#e6f0ff" : "#f8fafc"}}>
                      <td style={{
                        padding:"13px 6px",
                        fontWeight:idx===0?900:700,
                        color:idx===0?"#2563eb":"#222",
                        fontSize:"1.25rem",
                        textAlign:"center"
                      }}>
                        {idx === 0 ? "Leader (You)" : m.name}
                      </td>
                      <td style={{padding:"13px 6px", fontWeight:idx===0?800:700, fontSize:"1.22rem", textAlign:"center"}}>{m.studentId}</td>
                      <td style={{padding:"13px 6px", fontWeight:idx===0?800:700, fontSize:"1.22rem", textAlign:"center"}}>{m.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </>
  );
}