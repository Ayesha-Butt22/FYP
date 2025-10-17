import React from "react";
import PropTypes from "prop-types";
import { FaEnvelope, FaExternalLinkAlt, FaEdit, FaUsers, FaTools } from "react-icons/fa";
import "./GroupInfoCard.css";

export default function GroupInfoCard({ group, onOpen, onEdit }) {
  const members = group.members || [];
  const leader = members[0] || {};
  const others = members.slice(1, 3);

  return (
    <div className="group-card" role="region" aria-label={`Group ${group.id}`}>
      {/* Header with gradient */}
      <div className="card-header">
        <div className="gradient-bg" />
        <button
          className="icon-btn"
          onClick={() => onOpen?.(group)}
          title="Open Details"
          type="button"
          aria-label={`Open ${group.id}`}
        >
          <FaExternalLinkAlt size={16} color="white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="card-content">
        {/* Group ID - Center */}
        <div className="group-id-section">
          <div className="group-id">{group.id}</div>
        </div>

        {/* Total Members Count */}
        <div className="members-count" aria-hidden>
          <FaUsers size={16} />
          <span>{members.length} Team Members</span>
        </div>

        {/* Members List - up to 3 Members with SAP & Email */}
        <div className="members-section">
          {[leader, ...others].filter(Boolean).map((member, idx) => (
            <div key={idx} className="member-item">
              <div className="member-avatar" aria-hidden>
                {(member.name || "M").charAt(0).toUpperCase()}
              </div>
              <div className="member-details">
                <div className="member-name">{member.name}</div>
                <div className="member-info">
                  <span className="sap-id">SAP: {member.sap}</span>
                  <a
                    href={member.email ? `mailto:${member.email}` : "#"}
                    className="member-email"
                    onClick={(e) => { if (!member.email) e.preventDefault(); }}
                    title={member.email || ""}
                    aria-label={member.email ? `Email ${member.name}` : undefined}
                  >
                    <FaEnvelope size={12} />
                    <span className="member-email-text">{member.email || ""}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Project Title */}
        <div className="project-title-section">
          <h3 className="project-title">{group.title}</h3>
        </div>

        {/* Project Description */}
        <div className="project-description">
          <p>{group.description}</p>
        </div>

        {/* Tools & Technologies */}
        <div className="tools-section">
          <div className="tools-header">
            <FaTools size={14} />
            <span>Tools & Technologies</span>
          </div>
          <div className="tools-grid">
            {(group.tools || []).map((tool, i) => (
              <span key={i} className="tool-chip">{tool}</span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="card-actions">
          <button
            className="btn-edit"
            type="button"
            onClick={() => onEdit?.(group)}
            aria-label={`Edit ${group.id}`}
          >
            <FaEdit size={16} />
            <span>Edit Group</span>
          </button>
        </div>
      </div>
    </div>
  );
}

GroupInfoCard.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    tools: PropTypes.arrayOf(PropTypes.string),
    members: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        sap: PropTypes.string,
        email: PropTypes.string,
      })
    ),
  }).isRequired,
  onOpen: PropTypes.func,
  onEdit: PropTypes.func,
};