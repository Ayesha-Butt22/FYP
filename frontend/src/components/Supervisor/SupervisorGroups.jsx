import React, { useState, useEffect } from "react";
import DashboardSectionHeader from "./DashboardSectionHeader";
import { FaUsers, FaArrowRight, FaTimes } from "react-icons/fa";
import DonutChart from "./DonutChart";
import supervisorGroupsService from "../Api/supervisorGroupsService.jsx";
import { toastService } from "../ToastService/ToastService.jsx";
import "./SupervisorGroups.css";

export default function SupervisorGroups() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await supervisorGroupsService.getSupervisorGroupsWithDetails();
        
        if (response.success) {
          // Transform backend data to include milestone analytics
          const groupsWithMilestones = response.groups.map(group => ({
            ...group,
            milestones: generateMilestones(group)
          }));
          setAssignedGroups(groupsWithMilestones);
        } else {
          toastService.error('Failed to load groups');
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        toastService.error('Failed to load groups');
        setAssignedGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedGroup(null);
    };
    if (selectedGroup) {
      window.addEventListener("keydown", onKey);
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedGroup]);

  // Generate milestone data based on group progress
  const generateMilestones = (group) => {
    const progress = group.progress || 0;
    const completed = group.milestonesCompleted || 0;
    
    return [
      {
        name: "Proposal",
        score: completed >= 1 ? 95 : progress > 0 ? 50 : 0,
        level: completed >= 1 ? "Completed" : progress > 0 ? "In Progress" : "Not Started",
        timeSpent: completed >= 1 ? "0:45:00" : progress > 0 ? "0:20:00" : "0:00:00",
        totalTime: "1:00:00",
        color: "#2563eb"
      },
      {
        name: "Mid Evaluation",
        score: completed >= 3 ? 70 : completed >= 2 ? 45 : 0,
        level: completed >= 3 ? "Completed" : completed >= 2 ? "In Progress" : "Not Started",
        timeSpent: completed >= 3 ? "0:50:00" : completed >= 2 ? "0:20:00" : "0:00:00",
        totalTime: "1:00:00",
        color: "#22c55e"
      },
      {
        name: "Final Report",
        score: completed >= 5 ? 85 : completed >= 4 ? 35 : 0,
        level: completed >= 5 ? "Completed" : completed >= 4 ? "In Progress" : "Not Started",
        timeSpent: completed >= 5 ? "1:00:00" : completed >= 4 ? "0:15:00" : "0:00:00",
        totalTime: "1:00:00",
        color: "#f43f5e"
      }
    ];
  };

  if (loading) {
    return (
      <div className="supervisor-page-container">
        <DashboardSectionHeader
          description="Here you can view all FYP groups assigned to you. Click 'View Group Details' to see members, milestones, and progress analytics."
        >
          My Groups
        </DashboardSectionHeader>
        <div style={{ textAlign: 'center', padding: '48px 0', fontSize: '18px', color: '#888' }}>
          Loading groups...
        </div>
      </div>
    );
  }

  if (assignedGroups.length === 0) {
    return (
      <div className="supervisor-page-container">
        <DashboardSectionHeader
          description="Here you can view all FYP groups assigned to you. Click 'View Group Details' to see members, milestones, and progress analytics."
        >
          My Groups
        </DashboardSectionHeader>
        <div style={{ textAlign: 'center', padding: '48px 0', fontSize: '18px', color: '#888' }}>
          No groups assigned yet.
        </div>
      </div>
    );
  }

  return (
    <div className="supervisor-page-container">
      <DashboardSectionHeader
        description="Here you can view all FYP groups assigned to you. Click 'View Group Details' to see members, milestones, and progress analytics."
      >
        My Groups
      </DashboardSectionHeader>

      <div className="supervisor-group-cards-row">
        {assignedGroups.map(group => (
          <div className="supervisor-group-card" key={group._id || group.groupId}>
            <div className="supervisor-group-icon"><FaUsers /></div>
            <div className="supervisor-group-no">Group {group.groupNo}</div>
            <div className="supervisor-group-title" title={group.title}>{group.title}</div>
            <button className="supervisor-view-btn" onClick={() => setSelectedGroup(group)}>
              View Group Details <FaArrowRight />
            </button>
          </div>
        ))}
      </div>

      {/* ----- Modal for group details ----- */}
      {selectedGroup && (
        <div className="supervisor-modal-overlay" role="dialog" aria-modal="true" aria-label={`Details for ${selectedGroup.title}`}>
          <div className="supervisor-modal-card">
            <button className="supervisor-modal-close" aria-label="Close" onClick={() => setSelectedGroup(null)}>
              <FaTimes />
            </button>

            <div className="supervisor-modal-title">{selectedGroup.title}</div>

            {/* ----- Details Section ----- */}
            <div className="supervisor-group-details-form">
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Group Number:</span>
                <span className="supervisor-group-detail-value">{selectedGroup.groupNo}</span>
              </div>
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Group ID:</span>
                <span className="supervisor-group-detail-value">{selectedGroup.groupId}</span>
              </div>
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Program:</span>
                <span className="supervisor-group-detail-value">{selectedGroup.program}</span>
              </div>
              <div className="supervisor-group-detail-row">
                <span className="supervisor-group-detail-label">Proposal/Idea Status:</span>
                <span className={`supervisor-status-badge supervisor-status-${selectedGroup.proposalStatus.toLowerCase()}`}>
                  {selectedGroup.proposalStatus}
                </span>
              </div>

              {/* ----- Progress Section ----- */}
              <div className="supervisor-progress-row">
                <div style={{display: "flex", alignItems: "center", gap: 12, width: "100%", flexWrap: "wrap"}}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: 18 }}>Progress:</b>
                    <span style={{ color: "#15803d", fontWeight: 800, fontSize: 18 }}>
                      {selectedGroup.progress}%
                    </span>
                  </div>
                  <div className="supervisor-progress-subtext">
                    ({selectedGroup.milestonesCompleted} of {selectedGroup.milestonesTotal} milestones)
                  </div>
                </div>
              </div>
              <div className="supervisor-progress-bar-bg supervisor-progress-bar-bg-large">
                <div
                  className="supervisor-progress-bar-fill"
                  style={{
                    width: `${selectedGroup.progress}%`
                  }}
                />
              </div>
            </div>

            {/* ----- Members Table ----- */}
            <div className="supervisor-modal-label">Group Members:</div>
            <table className="supervisor-member-table supervisor-member-table-large">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>SAP ID</th>
                </tr>
              </thead>
              <tbody>
                {selectedGroup.members && selectedGroup.members.map((m, idx) => (
                  <tr key={`${m.email || m.sapId}-${idx}`}>
                    <td>{m.name}</td>
                    <td>{m.sapId}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ----- Donut Chart Analytics ----- */}
            <div className="supervisor-analytics-card supervisor-analytics-card-large">
              <h3 className="supervisor-chart-title">Progress Tracking</h3>
              <DonutChart
                data={selectedGroup.milestones.map(m => ({
                  label: m.name,
                  value: m.score,
                  color: m.color
                }))}
                size={360}
                donutWidth={90}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}