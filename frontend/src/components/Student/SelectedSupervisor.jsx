import React from 'react';
import DashboardSectionHeader from '../Supervisor/DashboardSectionHeader'; // adjust path if needed
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import './SelectedSupervisor.css';

const SelectedSupervisor = () => {
  const supervisor = {
    name: "Dr. Sarah Khan",
    designation: "Associate Professor",
    department: "Computer Science Department",
    specialization: "AI, Web Development", // will be rendered as tags
    email: "sarah.khan@university.edu",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
  };

  // split specialization into tags by comma (preserves original string if no comma)
  const tags = (supervisor.specialization || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div>
      <DashboardSectionHeader description="View your selected supervisor details.">
        Selected Supervisor
      </DashboardSectionHeader>

      <div className="ss-container">
        <div className="ss-card">
          <img 
            src={supervisor.image} 
            alt={supervisor.name}
            className="ss-image"
          />
          <h2 className="ss-name">{supervisor.name}</h2>
          <p className="ss-designation">{supervisor.designation}</p>
          <p className="ss-department">{supervisor.department}</p>

          {/* Email next to icon (moved here as requested) */}
          <div className="ss-email-inline" aria-label="email">
            <EmailOutlinedIcon className="ss-email-icon" />
            <a className="ss-email-link" href={`mailto:${supervisor.email}`}>{supervisor.email}</a>
          </div>

        

          {/* Expertise tags - rendered as rounded blue pills, tags container background removed */}
          <div className="ss-tags-section" aria-hidden>
            <div className="ss-tags-wrapper no-bg">
              {tags.map((t, i) => (
                <span key={i} className="ss-tag">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedSupervisor;