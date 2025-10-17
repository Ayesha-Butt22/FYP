import React, {useEffect, useState} from "react";
import GroupInfoCard from "./GroupInfoCard";
import DashboardSectionHeader from "./DashboardSectionHeader";
import "./GroupsGrid.css";

const sampleGroups = [
    {
        id: "G-101",
        title: "Smart Parking System",
        description:
            "Parking guidance using computer vision to detect available parking spaces and notify drivers in real-time through mobile notifications and web dashboard.",
        tools: ["React", "Node.js", "OpenCV", "MongoDB", "Express"],
        members: [
            {name: "Ayesha Butt", sap: "48288", email: "ayesha.butt@riphah.edu.pk"},
            {name: "Madiha Saeed", sap: "48289", email: "madiha.saeed@riphah.edu.pk"},
            {name: "Sara Khan", sap: "48290", email: "sara.khan@riphah.edu.pk"}
        ]
    },
    {
        id: "G-102",
        title: "Campus Chatbot Assistant",
        description:
            "AI-powered conversational assistant for campus services with natural language processing and intent recognition to help students with queries about courses, schedules, and facilities.",
        tools: ["Python", "Rasa", "Docker", "FastAPI", "PostgreSQL"],
        members: [
            {name: "Bilal Ahmed", sap: "48300", email: "bilal.ahmed@riphah.edu.pk"},
            {name: "Zoya Hassan", sap: "48301", email: "zoya.hassan@riphah.edu.pk"},
            {name: "Usman Ali", sap: "48302", email: "usman.ali@riphah.edu.pk"}
        ]
    },
    {
        id: "G-103",
        title: "E-Learning Management Portal",
        description:
            "Comprehensive learning management system featuring video lectures, interactive quizzes, assignment tracking, and real-time collaboration tools for enhanced online education experience.",
        tools: ["React", "Django", "PostgreSQL", "Redis", "AWS"],
        members: [
            {name: "Ahmed Ali", sap: "48310", email: "ahmed.ali@riphah.edu.pk"},
            {name: "Fatima Khan", sap: "48311", email: "fatima.khan@riphah.edu.pk"},
            {name: "Hira Ahmed", sap: "48312", email: "hira.ahmed@riphah.edu.pk"}
        ]
    }
];

export default function GroupsGrid() {
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        setGroups(sampleGroups);
    }, []);

    return (
        <div>
            <DashboardSectionHeader>Groups</DashboardSectionHeader>
            <div className="section-desc">
                View all department groups, check members, project details and manage them from here.
            </div>
            <GroupInfoCard groups={groups}/>
        </div>
    );
}