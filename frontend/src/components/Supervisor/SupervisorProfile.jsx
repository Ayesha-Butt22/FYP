import React, {useEffect, useState} from "react";
import {
    FaUserTie,
    FaEnvelope,
    FaLightbulb,
    FaPlusCircle,
    FaTrash,
    FaPlus,
} from "react-icons/fa";
import {Chip, TextField, Button, IconButton, Box, Modal, Typography} from "@mui/material";
import ProfileService from "../Api/ProfileService.jsx";
import DashboardSectionHeader from "./DashboardSectionHeader.jsx";

const styles = {
    container: {
        width: '100%',
    },
    cardsWrapper: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '28px',
        margin: '0 auto',
    },
    card: {
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '24px',
        padding: '40px 32px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
    },
    cardHover: {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px rgba(37, 99, 235, 0.15)',
    },
    profileCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    },
    avatarContainer: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
        position: 'relative',
    },
    avatarRing: {
        position: 'absolute',
        width: '140px',
        height: '140px',
        border: '3px solid rgba(37, 99, 235, 0.2)',
        borderRadius: '50%',
    },
    name: {
        fontSize: '28px',
        fontWeight: '900',
        color: '#01337a',
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#2563eb',
        marginBottom: '16px',
    },
    email: {
        fontSize: '15px',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        justifyContent: 'center',
        marginBottom: '24px',
    },
    expertiseSection: {
        background: '#f1f5f9',
        borderRadius: '16px',
        padding: '20px',
        width: '100%',
        marginTop: 'auto',
    },
    expertiseTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#475569',
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    expertiseTags: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px',
    },
    expertiseTag: {
        background: '#2563eb',
        color: '#fff',
        fontWeight: '700',
        borderRadius: '8px',
        padding: '6px 16px',
        fontSize: '13px',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e2e8f0',
    },
    cardTitle: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#01337a',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    skillsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '20px',
        maxHeight: '280px',
        overflowY: 'auto',
        paddingRight: '8px',
    },
    skillItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    skillContent: {
        flex: '1',
    },
    skillName: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#01337a',
        marginBottom: '8px',
    },
    skillBarContainer: {
        width: '100%',
        height: '12px',
        background: '#e2e8f0',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative',
    },
    skillBar: {
        height: '100%',
        borderRadius: '6px',
        transition: 'width 0.6s ease',
        position: 'relative',
    },
    skillPercent: {
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '11px',
        fontWeight: '700',
        color: '#fff',
    },
    addButton: {
        background: '#2563eb',
        color: '#fff',
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: 'none',
    },
    ideasList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '24px',
        minHeight: '200px',
    },
    ideaItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s ease',
    },
    ideaItemHover: {
        background: '#f1f5f9',
        borderColor: '#2563eb',
    },
    ideaText: {
        flex: '1',
        fontSize: '15px',
        fontWeight: '600',
        color: '#1e293b',
        lineHeight: '1.5',
    },
    inputGroup: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: '20px',
        borderTop: '2px solid #e2e8f0',
    },
    modalContent: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '32px',
    },
    modalTitle: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#01337a',
        marginBottom: '24px',
        textAlign: 'center',
    },
    colorPickerGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '12px',
    },
    colorPicker: {
        width: '50px',
        height: '50px',
        borderRadius: '8px',
        border: '2px solid #e2e8f0',
        cursor: 'pointer',
    },
    helpText: {
        fontSize: '13px',
        color: '#64748b',
        textAlign: 'center',
        marginTop: '12px',
        lineHeight: '1.5',
    },
};

export default function SupervisorProfile({supervisorInfo}) {
    const [skills, setSkills] = useState([
        {label: "Python", color: "#2563eb", percent: 90},
        {label: "React", color: "#f59e0b", percent: 85},
        {label: "AI/ML", color: "#10b981", percent: 95},
        {label: "Node.js", color: "#ef4444", percent: 70},
    ]);
    const [profilePic, setProfilePic] = useState(null);
    const email = localStorage.getItem("email");
    const [newSkill, setNewSkill] = useState("");
    const [newSkillPercent, setNewSkillPercent] = useState("");
    const [newSkillColor, setNewSkillColor] = useState("#2563eb");
    const [skillModalOpen, setSkillModalOpen] = useState(false);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [hoveredIdea, setHoveredIdea] = useState(null);


    useEffect(() => {
        const loadProfilePic = async () => {
            if (!email) return;
            const imageUrl = await ProfileService.getProfilePic(email);
            if (imageUrl) setProfilePic(imageUrl);
        };
        loadProfilePic();
    }, [email]);


    const expertiseTags = ["AI", "ML", "Web"];
    const [ideas, setIdeas] = useState([
        "AI-Based Disease Prediction",
        "Smart Attendance System",
        "Online Exam Proctoring",
    ]);
    const [newIdea, setNewIdea] = useState("");

    const handleSkillAdd = () => {
        const trimmed = newSkill.trim();
        const percent = parseInt(newSkillPercent, 10);
        if (
            trimmed &&
            !skills.some((s) => s.label.toLowerCase() === trimmed.toLowerCase()) &&
            !isNaN(percent) &&
            percent >= 1 &&
            percent <= 100
        ) {
            setSkills([...skills, {label: trimmed, color: newSkillColor, percent}]);
            setNewSkill("");
            setNewSkillPercent("");
            setNewSkillColor("#2563eb");
            setSkillModalOpen(false);
        }
    };

    const handleSkillRemove = (label) =>
        setSkills(skills.filter((s) => s.label !== label));

    const handleAddIdea = () => {
        const trimmed = newIdea.trim();
        if (trimmed && !ideas.includes(trimmed)) {
            setIdeas([...ideas, trimmed]);
            setNewIdea("");
        }
    };

    const handleRemoveIdea = (idea) =>
        setIdeas(ideas.filter((i) => i !== idea));

    return (
        <div>
            <DashboardSectionHeader
                description={`Here you can see your profile. Click "Add or + button" to add any idea that fills your mind for fyp,
              and your current skills are also visible to students you they can select the best from you.`}
            >
                Profile
            </DashboardSectionHeader>
            <div style={styles.container}>
                <div style={styles.cardsWrapper}>

                    <div
                        style={{
                            ...styles.card,
                            ...styles.profileCard,
                            ...(hoveredCard === 'profile' ? styles.cardHover : {}),
                        }}
                        onMouseEnter={() => setHoveredCard('profile')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div style={styles.avatarContainer}>
                            <div style={styles.avatarRing}></div>
                            {profilePic ? (
                                <img
                                    src={profilePic}
                                    alt="Profile"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <FaUserTie size={60} color="#fff"/>
                            )}
                        </div>
                        <div style={styles.name}>
                            {supervisorInfo?.name || "Ayesha"}
                        </div>
                        <div style={styles.subtitle}>
                            {supervisorInfo?.subtitle || "AI, ML, Software Engineering"}
                        </div>
                        <div style={styles.email}>
                            <FaEnvelope color="#2563eb"/>
                            {supervisorInfo?.email || "ayesha@riphah.edu.pk"}
                        </div>
                        <div style={styles.expertiseSection}>
                            <div style={styles.expertiseTitle}>Expertise Tags</div>
                            <div style={styles.expertiseTags}>
                                {expertiseTags.map((tag, i) => (
                                    <span key={i} style={styles.expertiseTag}>
                  {tag}
                </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            ...styles.card,
                            ...(hoveredCard === 'skills' ? styles.cardHover : {}),
                        }}
                        onMouseEnter={() => setHoveredCard('skills')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div style={styles.cardHeader}>
                            <div style={styles.cardTitle}>
                                My Skills
                                <Chip
                                    size="small"
                                    label="Top Skills"
                                    sx={{
                                        background: '#dbeafe',
                                        color: '#2563eb',
                                        fontWeight: '700',
                                        fontSize: '12px',
                                    }}
                                />
                            </div>
                            <IconButton
                                onClick={() => setSkillModalOpen(true)}
                                sx={{
                                    bgcolor: '#2563eb',
                                    color: '#fff',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    '&:hover': {bgcolor: '#1d4ed8'},
                                }}
                            >
                                <FaPlus/>
                            </IconButton>
                        </div>

                        <div style={styles.skillsList}>
                            {skills.map((skill) => (
                                <div key={skill.label} style={styles.skillItem}>
                                    <div style={styles.skillContent}>
                                        <div style={styles.skillName}>{skill.label}</div>
                                        <div style={styles.skillBarContainer}>
                                            <div
                                                style={{
                                                    ...styles.skillBar,
                                                    width: `${skill.percent}%`,
                                                    background: skill.color,
                                                }}
                                            >
                                                <span style={styles.skillPercent}>{skill.percent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <IconButton
                                        size="small"
                                        sx={{color: '#ef4444'}}
                                        onClick={() => handleSkillRemove(skill.label)}
                                    >
                                        <FaTrash size={16}/>
                                    </IconButton>
                                </div>
                            ))}
                        </div>

                        <div style={styles.helpText}>
                            Add your skills and proficiency levels to help students understand your expertise.
                        </div>

                        {/* Modal */}
                        <Modal open={skillModalOpen} onClose={() => setSkillModalOpen(false)}>
                            <Box sx={styles.modalContent}>
                                <div style={styles.modalTitle}>Add New Skill</div>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Skill name (e.g., Python)"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    sx={{mb: 2}}
                                />
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    type="number"
                                    placeholder="Proficiency (1-100)"
                                    value={newSkillPercent}
                                    onChange={(e) => setNewSkillPercent(e.target.value)}
                                    inputProps={{min: 1, max: 100}}
                                    sx={{mb: 2}}
                                />
                                <div style={styles.colorPickerGroup}>
                                    <span style={{fontWeight: '700', color: '#64748b'}}>Bar Color:</span>
                                    <input
                                        type="color"
                                        value={newSkillColor}
                                        onChange={(e) => setNewSkillColor(e.target.value)}
                                        style={styles.colorPicker}
                                    />
                                </div>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleSkillAdd}
                                    startIcon={<FaPlus/>}
                                    sx={{
                                        mt: 3,
                                        bgcolor: '#2563eb',
                                        color: '#fff',
                                        fontWeight: '700',
                                        fontSize: '16px',
                                        textTransform: 'none',
                                        py: 1.5,
                                        borderRadius: '12px',
                                        '&:hover': {bgcolor: '#1d4ed8'},
                                    }}
                                >
                                    Add Skill
                                </Button>
                            </Box>
                        </Modal>
                    </div>

                    <div
                        style={{
                            ...styles.card,
                            display: 'flex',
                            flexDirection: 'column',
                            ...(hoveredCard === 'ideas' ? styles.cardHover : {}),
                        }}
                        onMouseEnter={() => setHoveredCard('ideas')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div style={styles.cardHeader}>
                            <div style={styles.cardTitle}>
                                Project Ideas
                                <FaLightbulb color="#f59e0b"/>
                            </div>
                        </div>

                        <div style={styles.ideasList}>
                            {ideas.map((idea, i) => (
                                <div
                                    key={i}
                                    style={{
                                        ...styles.ideaItem,
                                        ...(hoveredIdea === i ? styles.ideaItemHover : {}),
                                    }}
                                    onMouseEnter={() => setHoveredIdea(i)}
                                    onMouseLeave={() => setHoveredIdea(null)}
                                >
                                    <FaLightbulb color="#f59e0b" size={18} style={{marginTop: '2px'}}/>
                                    <div style={styles.ideaText}>{idea}</div>
                                    <IconButton
                                        size="small"
                                        sx={{color: '#ef4444'}}
                                        onClick={() => handleRemoveIdea(idea)}
                                    >
                                        <FaTrash size={14}/>
                                    </IconButton>
                                </div>
                            ))}
                        </div>

                        <div style={styles.inputGroup}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="Add project idea..."
                                value={newIdea}
                                onChange={(e) => setNewIdea(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddIdea();
                                }}
                                sx={{
                                    bgcolor: '#f8fafc',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px',
                                    },
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleAddIdea}
                                startIcon={<FaPlusCircle/>}
                                sx={{
                                    bgcolor: '#2563eb',
                                    color: '#fff',
                                    fontWeight: '700',
                                    textTransform: 'none',
                                    px: 3,
                                    borderRadius: '12px',
                                    '&:hover': {bgcolor: '#1d4ed8'},
                                }}
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}