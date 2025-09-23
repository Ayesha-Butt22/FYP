//components/RolesPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import studentBg from "../assets/StudentRole.jpg";
import supervisorBg from "../assets/supervisor.png";
import coordinatorBg from "../assets/project.webp";
import adminBg from "../assets/admin.jpg";
import rolesBackground from "../assets/RP.png";
import capImg from "../assets/cap.png";

// --- Global Styles for custom cursor ---
const GlobalStyle = createGlobalStyle`
  html, body, #root {
    cursor: none !important;
  }
`;

// --- Fade In Animation for whole page ---
const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(40px);}
  100% { opacity: 1; transform: translateY(0);}
`;

// --- Card Gradient Backgrounds for Overlay ---
const cardGradients = [
  "linear-gradient(45deg, #01337a, #01337a 40%, #01337a 40%, #01337a 90%, #01337a 75%, #01337a 100%)",
  "linear-gradient(to top, #01337a, #01337a)",
  "linear-gradient(to top, #01337a, #01337a)",
  "linear-gradient(60deg, #1d3557, #457b9d 70%, #01337a 100%)", // admin card gradient
];

const cardData = [
  {
    label: "Student",
    desc: "Submit proposals, upload docs, collaborate\nwith your team and supervisor.",
    bg: studentBg,
  },
  {
    label: "Project Coordinator",
    desc: "Oversee all projects, assign supervisors,\nand manage evaluation stages.",
    bg: coordinatorBg,
  },
  {
    label: "Supervisor",
    desc: "Guide students, approve milestones, and\ndeliver evaluations.",
    bg: supervisorBg,
  },
  {
    label: "Admin",
    desc: "Full system access, manage all users,\nand oversee platform settings.",
    bg: adminBg,
  },
];

// --- Animations ---
const face1In = keyframes`
  from { transform: translateY(100px);}
  to { transform: translateY(0);}
`;
const face2In = keyframes`
  from { transform: translateY(-100px);}
  to { transform: translateY(0);}
`;

const iconRotate = keyframes`
  from { transform: translate(-50%, -50%) rotate(0);}
  to { transform: translate(-50%, -50%) rotate(360deg);}
`;

const RolesBg = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: url(${rolesBackground}) center center/cover no-repeat;
  display: flex;
  flex-direction: column;
  align-items: center; /* centered for all children */
  justify-content: center;
  animation: ${fadeIn} 1.05s cubic-bezier(.7,0,.15,1) both;
`;

const HeadlineContainer = styled.div`
  margin-top: 30px;
  margin-bottom: 40px;
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Headline = styled.h1`
  font-size: 2.7rem;
  letter-spacing: 1px;
  font-weight: 700;
  color: #141414ff;
`;

const Subheading = styled.p`
  font-size: 1.13rem;
  color: #f5f5f8ff;
  opacity: 0.86;
`;

const CardsRow = styled.div`
  width: 1400px;
  max-width: 99vw;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 38px;
  padding: 20px 0;
  flex-wrap: nowrap;
  margin: 0 auto;

  @media (max-width: 1500px) {
    width: 98vw;
    gap: 20px;
  }
  @media (max-width: 1200px) {
    gap: 10px;
    width: 98vw;
  }
  @media (max-width: 1050px) {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 18px;
    width: 98vw;
  }
  @media (max-width: 900px) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 18px;
    width: 100vw;
  }
`;

const Card = styled.div`
  position: relative;
  border-radius: 18px;
  width: 320px;
  height: 380px;
  perspective: 1000px;
  cursor: pointer;
  box-shadow: 0 8px 32px 0 rgba(8, 8, 8, 1), 0 1.5px 10px 0 #17182c11;
  transition: box-shadow 0.3s, transform 0.28s;
  background: #eef4fc;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  &:hover {
    box-shadow: 0 24px 64px 0 rgb(1,51,122), 0 8px 40px 0 #cfd2ff33;
    transform: translateY(-7px) scale(1.04);
  }
  &:hover .face1 {
    background: ${({ idx }) => cardGradients[idx]};
    transform: translateY(0);
    animation: ${face1In} 0.45s forwards;
    opacity: 0.98;
  }
  &:hover .icon {
    animation: ${iconRotate} 0.7s ease-in-out;
  }
  &:hover .face2 {
    transform: translateY(0);
    animation: ${face2In} 0.45s forwards;
    box-shadow: 0 20px 50px rgba(0,0,0,0.18);
  }
`;

const Face1 = styled.div`
  width: 100%;
  height: 195px;
  position: relative;
  background: rgb(1,51,122);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 1;
  border-radius: 18px 18px 0 0;
  transform: translateY(100px);
  transition: 0.52s;
  will-change: background, transform;
  opacity: 0.97;
  overflow: hidden;
`;

const Face1Img = styled.img`
  width: 92%;
  max-height: 165px;
  object-fit: contain;
  object-position: center;
  display: block;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 8px 32px rgba(0,0,0,0.07);
  background: #fff;
  margin: 0 auto;
`;

const Face2 = styled.div`
  width: 100%;
  height: 185px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 28px 20px 20px 20px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 0 0 18px 18px;
  box-shadow: 0 12px 36px rgba(0,0,0,0.10);
  transform: translateY(-100px);
  transition: 0.52s;
  z-index: 2;
`;

const RoleLabel = styled.div`
  font-size: 1.38rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #0b0b0bff;
  text-align: center;
  margin-top: 10px;
  margin-bottom: 7px;
`;

const RoleLine = styled.div`
  width: 36px;
  height: 4px;
  background: #2563eb;
  opacity: 0.7;
  border-radius: 2px;
  margin: 0 auto 14px auto;
`;

const RoleDesc = styled.div`
  font-size: 1.09rem;
  color: #141414ff;
  text-align: center;
  font-weight: 500;
  letter-spacing: 0.01em;
  opacity: 0.96;
  margin-top: 4px;
  line-height: 1.5;
`;

// --- Custom Cap Cursor ---
const CursorCap = styled.img`
  position: fixed;
  left: 0;
  top: 0;
  width: 48px;
  height: 48px;
  pointer-events: none;
  z-index: 99999;
  transform: translate(-50%, -50%) scale(1);
  filter: drop-shadow(0 2px 12px #01337a66);
  transition: transform 0.16s cubic-bezier(.7,0,.3,1), filter 0.18s;
  will-change: transform;
  user-select: none;
`;

const RoleCard = ({ label, desc, bg, idx, onSelect }) => (
  <Card
    idx={idx}
    tabIndex={0}
    className="role-card big-card"
    style={{
      animationDelay: `${idx * 0.16 + 0.07}s`
    }}
    onClick={() => onSelect(label)}
    onKeyPress={e => {
      if (e.key === "Enter") onSelect(label);
    }}
    role="button"
    aria-label={`Select ${label} role`}
  >
    <Face1 className="face1">
      <Face1Img src={bg} alt={label} draggable={false} />
    </Face1>
    <Face2 className="face2">
      <RoleLabel>{label}</RoleLabel>
      <RoleLine />
      <RoleDesc>
        {desc.split("\n").map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </RoleDesc>
    </Face2>
  </Card>
);

const RolesPageMiddle = () => {
  const navigate = useNavigate();

  // Custom cap cursor state
  const [cursor, setCursor] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const moveCursor = (e) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  const handleSelect = (label) => {
    let roleParam = label.toLowerCase().replace(/\s+/g, "");
    if (roleParam === "projectcoordinator") roleParam = "coordinator";
    navigate(`/auth?role=${roleParam}`);
  };

  return (
    <>
      <GlobalStyle />
      <CursorCap
        src={capImg}
        alt="cursor"
        style={{
          left: `${cursor.x}px`,
          top: `${cursor.y}px`
        }}
        draggable={false}
      />
      <RolesBg>
        <HeadlineContainer>
          <Headline>Select Your Role</Headline>
          <Subheading>
            Pick your role to get started.<br />
            Your journey begins here with a role tailored to your goals!
          </Subheading>
        </HeadlineContainer>
        <CardsRow>
          {cardData.map((card, idx) => (
            <RoleCard
              key={card.label}
              label={card.label}
              desc={card.desc}
              bg={card.bg}
              idx={idx}
              onSelect={handleSelect}
            />
          ))}
        </CardsRow>
      </RolesBg>
    </>
  );
};

export default RolesPageMiddle;