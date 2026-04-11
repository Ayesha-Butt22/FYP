// OverviewStudent.jsx
import React, { useEffect, useState } from "react";
import { FaUsers, FaClipboardCheck, FaCalendarCheck, FaCheckCircle, FaStar, FaArrowRight, FaBookOpen, FaTasks, FaLightbulb, FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StudentWhiteboard from "./StudentWhiteboard";
import "./OverviewStudent.css";
import ToastService from "../ToastService/ToastService.jsx";
import SlotBookingModal from "./Modal/SlotsBookingModal.jsx";
import styled, { css, keyframes } from "styled-components";

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
    props.$glow &&
    css`
      animation: ${glow} 1.5s infinite;
    `}
`;

const getTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInMinutes > 0) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  return "Just now";
};

export default function OverviewStudent({ onTabChange }) {
  const navigate = useNavigate();
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const studentEmail = localStorage.getItem("email");
  const [slotModalOpen, setSlotModalOpen] = useState(false);

  const [hasNewNotification, setHasNewNotification] = useState(true);
  const [stats, setStats] = useState(null);
  const [allBookings, setAllBookings] = useState([]); // Array for multiple active bookings
  // All unbooked published slots for this group (backend already filters)
  const [availableSlots, setAvailableSlots] = useState({
    availableSlots: [],
    activeBookings: [],
    status: null,
    message: "",
    groupId: null
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fypResults, setFypResults] = useState([]);

  useEffect(() => {
    const IsApproved = localStorage.getItem('IsApproved');
    if (IsApproved !== "true") {
      ToastService.error('Your account is not approved yet contact admin...Logging out');
      setTimeout(() => { localStorage.clear(); window.location.href = "/auth"; }, 3000);
      return
    }
    const checkSlotBooking = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/deadlineSchedule/getSlots/${studentEmail}`);
        const data = await res.json();

        if (!data.success) {
          if (res.status === 404) {
            console.warn("Group not found for student email:", studentEmail);
          }
          return;
        }

        // Handle completed status
        if (data.status === "completed") {
          setAvailableSlots({
            availableSlots: [],
            activeBookings: [],
            status: "completed",
            message: data.message,
            groupId: data.groupId || null
          });
          return;
        }

        // Handle active/waiting — slots available to book
        setAvailableSlots({
          availableSlots: data.availableSlots || [],
          activeBookings: data.activeBookings || [],
          status: data.status || null,
          message: data.message || "",
          groupId: data.groupId || null
        });

        // Auto-open modal if there are available slots for a NEW milestone
        if (data.availableSlots?.length > 0) {
          const lastSlot = data.availableSlots[data.availableSlots.length - 1];
          // Only auto-open once or if they click the button
          if (new Date(lastSlot.startTime) > new Date()) {
            // Silence toast if we already have some bookings, just let them see the button
            if (!data.activeBookings || data.activeBookings.length === 0) {
              ToastService.info("Please book your first presentation slot!");
            }
          }
        }

        if (data.activeBookings?.length > 0) {
          const list = data.activeBookings.map(sched => {
            const mySlot = sched.bookedSlot ||
              sched.slots?.find(s => {
                const b = s.bookedBy?._id?.toString() || s.bookedBy?.toString();
                return b === data.groupId?.toString();
              });
            return {
              week: sched.week,
              fypPart: sched.fypPart,
              venue: sched.venue,
              startTime: mySlot?.startTime,
              endTime: mySlot?.endTime
            };
          });
          setAllBookings(list);
        } else {
          setAllBookings([]);
        }
      } catch (err) {
        console.error("Error checking slot booking:", err);
      }
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        const [statsRes, activitiesRes, resultsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/student/stats`, { headers }),
          fetch(`http://localhost:5000/api/student/recent-activities`, { headers }),
          fetch(`http://localhost:5000/api/coordinator/final-results`, { headers })
        ]);

        const statsData = await statsRes.json();
        const activitiesData = await activitiesRes.json();
        const resultsData = await resultsRes.json();

        if (statsData.success) setStats(statsData.stats);
        if (activitiesData.success) setActivities(activitiesData.activities || []);
        if (resultsData.success) setFypResults(resultsData.data || []);
      } catch (err) {
        console.error("Error fetching overview data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (studentEmail) {
      checkSlotBooking();
      fetchData();
    }
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
          >
            <GlowingIconWrapper $glow={hasNewNotification}>
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

          {/* Book Presentation — always visible, modal shows slots or empty state */}
          <button
            className="quick-link-btn"
            style={{ background: "#01337a", color: "white" }}
            onClick={() => setSlotModalOpen(true)}
          >
            <FaCalendarCheck /> Book Presentation <FaArrowRight />
          </button>
        </div>
      </div>

      <div className="section-chip">Overview</div>
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#2563eb" }}><FaUsers /></div>
          <div className="stat-title">Group Status</div>
          <div className="stat-value-studentonly">{stats ? stats.groupStatus : "..."}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#fbc73d" }}><FaClipboardCheck /></div>
          <div className="stat-title">Proposal</div>
          <div className="stat-value-studentonly">
  {stats ? stats.proposalStatus : "..."}
</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#16a34a" }}><FaCalendarCheck /></div>
          <div className="stat-title">Next Meeting</div>
          <div className="stat-value-studentonly" style={{ fontSize: "1.8rem" }}>{stats ? stats.nextMeeting : "..."}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle" style={{ background: "#f43f5e" }}><FaCheckCircle /></div>
          <div className="stat-title">Milestones</div>
          <div className="stat-value-studentonly">{stats ? `${stats.milestonesCompleted}/8` : "..."}</div>
        </div>
      </div>

      <div className="progress-section-gap"></div>
      <div className="section-chip">Progress Overview</div>
      <div className="progress-box">
        <div>
          <div className="progress-label">
            <span>Main Milestones</span>
            <span>{stats ? Math.round((stats.milestonesCompleted / 8) * 100) : 0}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${stats ? (stats.milestonesCompleted / 8) * 100 : 0}%`, background: "#2563eb" }} />
          </div>
        </div>
      </div>

      <div className="progress-section-gap"></div>

      {/* ── FYP Completed Banner ── */}
      {availableSlots?.status === "completed" && (
        <>
          <div className="section-chip">FYP Status</div>
          <div className="progress-box" style={{ background: "linear-gradient(135deg,#e6ffe6,#d0f5d0)", border: "2px solid #00a651" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: "2.5rem" }}>🎓</span>
              <div>
                <h3 style={{ margin: 0, color: "#006b2e" }}>Congratulations! FYP Completed</h3>
                <p style={{ margin: "6px 0 0", color: "#005a25", fontWeight: 500 }}>
                  You have successfully cleared all milestones and submitted all required templates.
                </p>
              </div>
              <div style={{ marginLeft: "auto", background: "#00a651", color: "#fff", padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: "1rem" }}>
                ✅ PASSED
              </div>
            </div>
          </div>
          <div className="progress-section-gap"></div>
        </>
      )}

      
      
      <div className="section-chip">Recent Activity</div>
      <div className="activity-list">
        <div className="timeline">
          {activities.length > 0 ? activities.map((act, i) => (
            <div className="activity-item" key={i}>
              {act.text}
              <span className="time">{getTimeAgo(act.time)}</span>
            </div>
          )) : (
            <div className="activity-item">No recent activity</div>
          )}
        </div>
      </div>
      <div className="fyp-tip">
        <FaLightbulb style={{ color: "#ffbf00" }} />
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
          slots={availableSlots?.availableSlots || []}
          groupId={availableSlots.groupId}
          data={availableSlots}
        />
      )}

    </div>
  );
}