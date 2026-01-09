// OverviewStudent.jsx
import React, {useEffect, useState} from "react";
import { FaUsers, FaClipboardCheck, FaCalendarCheck, FaCheckCircle, FaStar, FaArrowRight, FaBookOpen, FaTasks, FaLightbulb } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StudentWhiteboard from "./StudentWhiteboard";
import "./OverviewStudent.css";
import ToastService from "../ToastService/ToastService.jsx";
import SlotBookingModal from "./Modal/SlotsBookingModal.jsx";
import styled, {css, keyframes} from "styled-components";

const glow = keyframes`
  0% {
    box-shadow: 0 0 5px #2196f3, 0 0 10px #2196f3, 0 0 20px #2196f3;
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 20px #64b5f6, 0 0 40px #2196f3, 0 0 60px #1976d2;
    transform: scale(1.1);
  }
  100% {
    box-shadow: 0 0 5px #2196f3, 0 0 10px #2196f3, 0 0 20px #2196f3;
    transform: scale(1);
  }
`;


const GlowingIconWrapper = styled.div`
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
  ${(props) =>
    props.glow &&
    css`
      animation: ${glow} 1.5s infinite;
    `}
`;

const activities = [
  { type: "group", text: "Invited Ali Raza to your group", time: "2 hours ago" },
  { type: "proposal", text: "Submitted Project Proposal", time: "Yesterday" },
  { type: "meeting", text: "Booked meeting with Dr. Khan", time: "3 days ago" },
  { type: "feedback", text: "Received feedback on SRS", time: "4 days ago" },
];
const progress = [
  { label: "Milestones Completed", percent: 60, color: "#2563eb" },
  { label: "Tasks Completed", percent: 45, color: "#fbc73d" },
  { label: "Meetings Attended", percent: 80, color: "#16a34a" },
  { label: "Templates Uploaded", percent: 35, color: "#f43f5e" },
];

export default function OverviewStudent({ onTabChange }) {
  const navigate = useNavigate();
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const studentEmail = localStorage.getItem("email");
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [hasNewNotification ,setHasNewNotification] = useState(true);

  useEffect(() => {
    const IsApproved = localStorage.getItem('IsApproved');
    if (IsApproved !== "true") {
      ToastService.error('Your account is not approved yet contact admin...Logging out');
      setTimeout(() => {  localStorage.clear(); window.location.href = "/auth"; }, 3000);
      return
    }

    const checkSlotBooking = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/deadlineSchedule/getSlots/${studentEmail}`);
        const data = await res.json();

        if (!data.success) return;


        /*CHECK ADDED */
if (!data.alreadyBooked && data.availableSlots?.length > 0) {
  const lastSlot = data.availableSlots[data.availableSlots.length - 1];
  const lastSlotStartTime = new Date(lastSlot.startTime);
  const now = new Date();

  if (lastSlotStartTime < now) {
    return; 
  }
}



        if (!data.alreadyBooked && data.availableSlots.length > 0) {
          ToastService.info("Please Book a slot");
          setAvailableSlots(data);
          setSlotModalOpen(true);
        }
        if (data.alreadyBooked && data.details) {
          const msg = `Your slot is booked for ${data.details?.week || "this week"} at venue ${data.details?.venue || "TBD"} — be ready!`;
          ToastService.success(msg);
        }

      } catch (err) {
        console.error("Error checking slot booking:", err);
      }
    };

    if (studentEmail) checkSlotBooking();
  }, [studentEmail]);


  return (
    <div className="overview-container">
      <div className="welcome-banner">
        <Tooltip title="Read instructions from supervisor" arrow>

          <button
            aria-label="Supervisor Notes"
            className="whiteboard-fab"
            onClick={() => {
              setWhiteboardOpen(true);
              setHasNewNotification(false);
            }}
            title="Supervisor Notes"
          >
            <GlowingIconWrapper glow={hasNewNotification}>
            <FaBookOpen />
            </GlowingIconWrapper>
          </button>
        </Tooltip>

        <div className="banner-title">Student Workspace!</div>
        <div className="banner-desc">
          All your FYP progress, group, supervisor, and tasks — in one place.<br />
          Stay organized, keep your group on track, and never miss a deadline.
        </div>
        <div className="banner-meta">
          <span>Semester: Fall 2025</span>
          <span style={{ marginLeft: 18 }}>|</span>
          <span style={{ marginLeft: 18 }}>Date: {new Date().toLocaleDateString()}</span>
        </div>
        <div className="quick-links">
          <button
            className="quick-link-btn"
            onClick={() => onTabChange("My Group")}
          >
            <FaUsers /> My Group <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => onTabChange("Idea & Proposal")}
          >
            <FaClipboardCheck /> Submit Proposal <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => onTabChange("Selected supervisor")}
          >
            <FaStar /> Supervisor <FaArrowRight />
          </button>
          <button
            className="quick-link-btn"
            onClick={() => onTabChange("Tasks")}
          >
            <FaTasks /> Tasks <FaArrowRight />
          </button>
        </div>
      </div>

      <div className="section-chip">Overview</div>
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#2563eb"}}><FaUsers /></div>
          <div className="stat-title">Group Status</div>
          <div className="stat-value-studentonly">Draft</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#fbc73d"}}><FaClipboardCheck /></div>
          <div className="stat-title">Proposal</div>
          <div className="stat-value-studentonly">Submitted</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#16a34a"}}><FaCalendarCheck /></div>
          <div className="stat-title">Next Meeting</div>
          <div className="stat-value-studentonly">25 Sep</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{background: "#f43f5e"}}><FaCheckCircle /></div>
          <div className="stat-title">Checklist</div>
          <div className="stat-value-studentonly">5/8</div>
        </div>
      </div>

      <div className="progress-section-gap"></div>
      <div className="section-chip">Progress Overview</div>
      <div className="progress-box">
        {progress.map((p, i) => (
          <div key={i}>
            <div className="progress-label">
              <span>{p.label}</span>
              <span>{p.percent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${p.percent}%`, background: p.color}} />
            </div>
          </div>
        ))}
      </div>

      <div className="progress-section-gap"></div>
      <div className="section-chip">Recent Activity</div>
      <div className="activity-list">
        <div className="timeline">
          {activities.map((act, i) => (
            <div className="activity-item" key={i}>
              {act.text}
              <span className="time">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="fyp-tip">
        <FaLightbulb style={{color: "#ffbf00"}}/>
        <span>Tip: Complete your checklist and upload all templates before final submission!</span>
      </div>

     
      <Dialog
        open={whiteboardOpen}
        onClose={() => setWhiteboardOpen(false)}
        fullWidth
        maxWidth="md"
        aria-labelledby="supervisor-notes-dialog"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
          <span style={{ fontWeight: 800, color: "#01337a" }}>Supervisor Instructions</span>
          <IconButton aria-label="close" onClick={() => setWhiteboardOpen(false)} size="large">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <StudentWhiteboard />
        </DialogContent>
      </Dialog>

      {slotModalOpen && (
          <SlotBookingModal
              open={slotModalOpen}
              onClose={() => setSlotModalOpen(false)}
              slots={availableSlots.availableSlots}
              groupId={availableSlots.groupId}
              scheduleId={availableSlots.scheduleId}
              data={availableSlots.wholeData }
          />
      )}

    </div>
  );
}