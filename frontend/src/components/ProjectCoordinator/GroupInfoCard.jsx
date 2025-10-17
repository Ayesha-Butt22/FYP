import React from "react";
import PropTypes from "prop-types";
import { FaEnvelope, FaUsers, FaTools } from "react-icons/fa";
import "./GroupInfoCard.css";

export default function GroupInfoCard({ groups }) {
    return (
        <div className="group-cards-container">
            {groups.map((group, index) => {
                const members = group.members || [];
                const displayMembers = members.slice(0, 3);

                return (
                    <div key={index} className="group-card" role="region" aria-label={`Group ${group.id}`}>
                        <div className="card-header"></div>

                        <div className="card-content">
                            <div className="group-id-section">
                                <div className="group-id">{group.id}</div>
                            </div>

                            <div className="members-count">
                                <FaUsers size={16} />
                                <span>{members.length} Team Members</span>
                            </div>

                            <div className="members-section">
                                {displayMembers.map((member, idx) => (
                                    <div key={idx} className="member-item">
                                        <div className="member-avatar">
                                            {(member.name || "M").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="member-details">
                                            <div className="member-name">{member.name}</div>
                                            <div className="member-info">
                                                <span className="sap-id">SAP: {member.sap}</span>
                                                {member.email && (
                                                    <a
                                                        href={`mailto:${member.email}`}
                                                        className="member-email"
                                                        title={member.email}
                                                        aria-label={`Email ${member.name}`}
                                                    >
                                                        <FaEnvelope size={12} />
                                                        <span className="member-email-text">{member.email}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="project-title-section">
                                <h3 className="project-title">{group.title}</h3>
                            </div>

                            <div className="project-description">
                                <p>{group.description}</p>
                            </div>
                            {group.tools && group.tools.length > 0 && (
                                <div className="tools-section">
                                    <div className="tools-header">
                                        <FaTools size={14} />
                                        <span>Tools & Technologies</span>
                                    </div>
                                    <div className="tools-grid">
                                        {group.tools.map((tool, i) => (
                                            <span key={i} className="tool-chip">{tool}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

GroupInfoCard.propTypes = {
    groups: PropTypes.arrayOf(
        PropTypes.shape({
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
        })
    ).isRequired,
};