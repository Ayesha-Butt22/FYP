import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { motion } from "framer-motion";
import logoImg from "../assets/logo.jpeg";
import backgroundImg from "../assets/EDU3.png";
import capImg from "../assets/cap.png";
import getUserInfoFromStorage from "./Auth/UserInfo.jsx";

// --- Global Styles ---
const GlobalStyle = createGlobalStyle`
  html, body, #root {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    cursor: none;
  }
  body {
    min-height: 100vh;
    min-width: 100vw;
    overflow-x: hidden;
  }
`;

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(40px);}
  100% { opacity: 1; transform: translateY(0);}
`;

const underlineDraw = keyframes`
  from { width: 0; }
  to { width: 80px; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
`;

const LoaderOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const CapSpinner = styled.img`
  width: 170px;
  height: 170px;
  animation: ${spin} 1.2s linear infinite;
  filter: drop-shadow(0 8px 32px #2563eb44);
  user-select: none;
  pointer-events: none;
`;

const LoaderText = styled.div`
  margin-top: 22px;
  font-size: 1.22rem;
  color: #2a326b;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 2px 10px #a5b4fc23;
`;

const CapLoader = () => (
  <LoaderOverlay>
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <CapSpinner src={capImg} alt="Loading..." />
      <LoaderText>Loading</LoaderText>
    </div>
  </LoaderOverlay>
);

const navGlow = keyframes`
  0% {
    box-shadow: 0 0 0 0 #2563eb66;
    background: rgba(255,255,255,0.14);
  }
  100% {
    box-shadow: 0 0 32px 6px #2563eb66, 0 2px 24px 8px #2563eb33;
    background: rgba(37,99,235,0.10);
  }
`;

const BgWrapper = styled.div`
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  background: url(${backgroundImg}) center center/cover no-repeat;
`;

const GlassNav = styled.nav`
  width: 100vw;
  padding: 32px 0 20px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.14);
  box-shadow: 0 8px 32px #b5baff3a;
  z-index: 3;
  position: relative;
  transition: box-shadow 0.3s, background 0.3s;
  @media (max-width: 700px) {
    flex-direction: column;
    gap: 14px;
    padding: 28px 0 0 0;
    align-items: stretch;
  }
  &:hover, &:focus-within {
    animation: ${navGlow} 0.4s forwards;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  font-weight: 900;
  font-size: 2.3rem;
  color: #01337a;
  gap: 10px;
  letter-spacing: -1px;
  margin-left: 36px;
  text-shadow: 0 4px 28px #4c3cf74c;
  img {
    width: 52px;
    height: 52px;
    object-fit: contain;
    margin-right: 10px;
    margin-bottom: 6px;
    border-radius: 12px;
    box-shadow: 0 3px 14px #4c3cf733;
    background: #fff;
    transition: transform 0.18s cubic-bezier(.7,0,.3,1);
  }
  &:hover img {
    transform: scale(1.08) rotate(-8deg);
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 44px;
  font-size: 1.2rem;
  color: #22243b;
  align-items: center;
  margin-right: 36px;
  font-weight: 700;
  a {
    text-decoration: none;
    color: inherit;
    font-weight: 700;
    opacity: 0.98;
    letter-spacing: 0.01em;
    position: relative;
    padding: 5px 0;
    border-radius: 7px;
    transition: color 0.15s, background 0.18s;
    &:hover, &:focus {
      color: #01337a;
      background: rgba(37,99,235,0.10);
    }
    &::after {
      content: '';
      display: block;
      position: absolute;
      left: 0; bottom: -6px;
      width: 0;
      height: 2.5px;
      background: linear-gradient(90deg, #2563eb 0%, #2563eb 100%);
      border-radius: 2.5px;
      transition: width 0.22s cubic-bezier(.7,0,.2,1);
      opacity: 0.7;
    }
    &:hover::after, &:focus::after {
      width: 100%;
    }
  }
`;

const Main = styled.div`
  flex: 1;
  width: 100vw;
  min-height: 70vh;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  z-index: 3;
  @media (max-width: 950px) {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
  }
`;

const LeftContent = styled.div`
  flex: 1.3;
  padding-left: 7vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 320px;
  z-index: 3;
  @media (max-width: 950px) {
    padding: 40px 5vw 0 5vw;
    align-items: center;
    text-align: center;
  }
`;

const AnimatedHeadlineWrapper = styled.div`
  margin-bottom: 12px;
`;

const AnimatedHeadline = styled.h1`
  font-size: 2.9rem;
  font-weight: 900;
  line-height: 1.13;
  margin: 0;
  letter-spacing: -1.2px;
  text-shadow: 0 3px 18px #818cf830;
  background: linear-gradient(90deg, #01337a 10%, #2563eb 40%, #ffb800 70%, #00e0ed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  width: fit-content;
  animation:
    ${fadeIn} 1.2s ease 0s 1 normal both;
  @media (max-width: 900px) {
    font-size: 1.6rem;
  }
  position: relative;
`;

const ShortBeautifulLine = styled.div`
  height: 5px;
  width: 80px;
  margin-top: 10px;
  background: linear-gradient(90deg, #8c8e90 0%, #fbc73d 100%);
  border-radius: 3px;
  animation: ${underlineDraw} 1.2s cubic-bezier(.85,0,.17,1) 0.7s both;
`;

const SubTitle = styled.p`
  font-size: 1.18rem;
  color: #01337a;
  font-weight: 500;
  margin-bottom: 34px;
  margin-top: 0;
  letter-spacing: 0.01em;
  opacity: 0.98;
  text-shadow: 0 2px 8px #818cf821;
  animation: ${fadeIn} 2.1s 0.6s both;
  @media (max-width: 900px) {
    font-size: 1rem;
    margin-bottom: 26px;
  }
`;

const GetStartedButton = styled.button`
  padding: 14px 44px;
  font-size: 1.19rem;
  font-weight: 800;
  border-radius: 36px;
  border: none;
  cursor: pointer;
  background: #01337a;
  color: #fff;
  box-shadow: 0 8px 32px 0 rgba(100,120,255,0.13), 0 1.5px 10px 0 #cfd2ff22;
  transition: background 0.22s, box-shadow 0.17s, transform 0.16s, color 0.21s;
  z-index: 10;
  outline: none;
  letter-spacing: 0.03em;
  min-width: 120px;
  max-width: 220px;
  opacity: 0.98;
  &:hover, &:focus {
    background: #01337a;
    color: #fff;
    box-shadow: 0 14px 36px 0 rgb(1,51,122), 0 2px 12px 0 #01337a;
    opacity: 1;
    transform: translateY(-2px) scale(1.03);
  }
`;

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

const assistantFloat = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-13px);}
  100% { transform: translateY(0);}
`;
const AssistantContainer = styled.div`
  position: fixed;
  bottom: 38px;
  right: 44px;
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  @media (max-width: 700px) {
    right: 10px;
    bottom: 10px;
  }
`;
const CapWithEyes = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  animation: ${assistantFloat} 2.2s ease-in-out infinite;
  filter: drop-shadow(0 4px 18px #01337a55);
`;
const AssistantCapImg = styled.img`
  width: 60px;
  height: 60px;
  display: block;
  user-select: none;
`;

const CapEyes = styled.div`
  position: absolute;
  left: 18px;
  top: 31px;
  width: 20px;
  height: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Eye = styled.div`
  width: 9px;
  height: 9px;
  background: #23233b;
  border-radius: 50%;
  margin: 0 1px;
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    width: 3px;
    height: 3px;
    background: #fff;
    border-radius: 50%;
    opacity: 0.7;
  }
`;

const ChatBubble = styled.div`
  max-width: 250px;
  background: linear-gradient(120deg, #f8fafc 70%, #e7eafc 100%);
  border-radius: 18px 18px 18px 5px;
  box-shadow: 0 3px 18px #01337a;
  padding: 18px 22px 16px 18px;
  font-size: 1.05rem;
  color: #01337a;
  font-weight: 600;
  margin-bottom: 10px;
  position: relative;
  animation: ${fadeIn} 3s;
  &:after {
    content: '';
    position: absolute;
    right: 15px;
    bottom: -15px;
    border-width: 10px 10px 0 10px;
    border-style: solid;
    border-color: #e7eafc transparent transparent transparent;
    display: block;
    width: 0;
  }
`;

// --- Typewriter/Word Morph Logic ---
const headlinePhrases = [
  "Manage Your FYP Journey Seamlessly",
  "Submit Proposals With One Click",
  "Work Collaboratively With Your Team",
  "Monitor Project Progress Instantly",
  "Receive Real-Time Supervisor Feedback"
];

function useTypewriterLoop(phrases, speed = 55, pause = 1400) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);
  const [char, setChar] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout;
    if (!isDeleting && char < phrases[index].length) {
      timeout = setTimeout(() => setChar(char + 1), speed);
    } else if (isDeleting && char > 0) {
      timeout = setTimeout(() => setChar(char - 1), Math.max(30, speed - 20));
    } else if (!isDeleting && char === phrases[index].length) {
      timeout = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && char === 0) {
      timeout = setTimeout(() => {
        setIndex((index + 1) % phrases.length);
        setIsDeleting(false);
      }, 400);
    }
    setDisplayed(phrases[index].slice(0, char));
    return () => clearTimeout(timeout);
  }, [phrases, index, char, isDeleting, speed, pause]);
  return displayed;
}

// --- Assistant Chat Bubbles Logic ---
const tips = [
  "👋 Hi! Welcome to Auto-FYP. Need help getting started?",
  "You can manage your Final Year Project from proposal to evaluation here.",
  "Use the Get Started button to pick your role and begin your journey!",
];
function useAssistantTips(tips, initialShow = true) {
  const [tipIndex, setTipIndex] = useState(0);
  const [show, setShow] = useState(initialShow);

  useEffect(() => {
    if (!show) return;
    if (tipIndex < tips.length - 1) {
      const timer = setTimeout(() => setTipIndex((i) => i + 1), 4000);
      return () => clearTimeout(timer);
    }
  }, [tipIndex, show, tips.length]);

  useEffect(() => {
    if (tipIndex === tips.length - 1 && show) {
      const timer = setTimeout(() => setShow(false), 5500);
      return () => clearTimeout(timer);
    }
  }, [tipIndex, show, tips.length]);

  return { show, tip: tips[tipIndex], setShow };
}

// --- How It Works Section (Framer Motion) ---
const steps = [
  {
    title: "Register & Login",
    desc: "Sign up with your university email for secure access."
  },
  {
    title: "Create or Join a Group",
    desc: "Invite classmates or join an existing group to collaborate."
  },
  {
    title: "Submit Your Project Proposal",
    desc: "Fill out project details and submit with one click."
  },
  {
    title: "Automatic Supervisor Allocation",
    desc: "Get matched to the best supervisor for your project."
  },
  {
    title: "Track Your Progress",
    desc: "Complete milestones, get feedback, and stay on top of tasks."
  },
  {
    title: "Final Evaluation",
    desc: "Receive grades, feedback, and download your FYP archive."
  }
];

const HowItWorksSectionWrapper = styled.section`
  background: transparent;
  padding: 70px 0 100px 0;
  position: relative;
  z-index: 2;
  overflow: hidden;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2.6rem;
  color: #01337a;
  font-weight: 900;
  margin-bottom: 54px;
  letter-spacing: -1px;
  text-shadow: 0 3px 18px #818cf830;
`;

const StepsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 40px 32px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 10px;
`;

const StepCard = styled(motion.div)`
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 24px #1e3a8a13;
  padding: 38px 28px 30px 28px;
  min-width: 270px;
  max-width: 315px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;
  position: relative;
  overflow: hidden;
  border-bottom: 5px solid #2563eb22;
`;

const StepNumber = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb 65%, #fbc73d 100%);
  color: #fff;
  font-size: 1.9rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px #2563eb17;
`;

const StepTitle = styled.div`
  font-size: 1.2rem;
  font-weight: 800;
  color: #01337a;
  margin-bottom: 2px;
`;

const StepDesc = styled.div`
  font-size: 1.04rem;
  font-weight: 500;
  color: #374151;
  opacity: 0.97;
`;

function HowItWorksSection() {
  // Ref to the section for inView trigger
  const ref = useRef(null);

  return (
    <HowItWorksSectionWrapper ref={ref}>
      <SectionTitle>How It Works: Your FYP Journey Simplified</SectionTitle>
      <StepsContainer>
        {steps.map((step, i) => (
          <StepCard
            key={i}
            initial={{ opacity: 0, y: 70, scale: 0.93 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              delay: 0.15 + i * 0.14,
              duration: 0.7,
              type: "spring"
            }}
            whileHover={{
              scale: 1.045,
              boxShadow: "0 6px 32px #01337a22"
            }}
          >
            <StepNumber>{i + 1}</StepNumber>
            <StepTitle>{step.title}</StepTitle>
            <StepDesc>{step.desc}</StepDesc>
          </StepCard>
        ))}
      </StepsContainer>
    </HowItWorksSectionWrapper>
  );
}

const LandingPage = () => {
  const navigate = useNavigate();
  const [logedUser , setLogedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const logedUser = getUserInfoFromStorage();
    if (logedUser.email){
    setLogedUser(logedUser);
    }
  }, []);

  const goToDashboard = () => {
    if (!logedUser) return;
    switch (logedUser.role) {
      case "student":
        navigate("/dashboard/student");
        break;
      case "supervisor":
        navigate("/dashboard/supervisor");
        break;
      case "admin":
        navigate("/dashboard/admin");
        break;
      case "coordinator":
        navigate("/dashboard/coordinator");
        break;
      default:
        break;
    }
  };

  // --- Custom Cursor State ---
  const [cursor, setCursor] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // Typewriter effect
  const headlineText = useTypewriterLoop(headlinePhrases, 55, 1400);

  // Assistant
  const assistant = useAssistantTips(tips);

  useEffect(() => {
    const moveCursor = (e) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  const handleGetStarted = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/auth");
    }, 1200);
  };

  return (
    <>
      <GlobalStyle />
      {loading && <CapLoader />}
      <CursorCap
        src={capImg}
        alt="cursor"
        style={{
          left: `${cursor.x}px`,
          top: `${cursor.y}px`
        }}
        draggable={false}
      />
      <BgWrapper>
        <GlassNav>
          <Logo>
            <img src={logoImg} alt="Auto-FYP logo" />
            Auto-FYP
          </Logo>
          <NavLinks>
            {!logedUser ? (
                <>
                  <Link to="/">Home</Link>
                  <Link to="/about">About Us</Link>
                  <Link to="/auth">Login</Link>
                  <Link to="/auth">Signup</Link>
                </>
            ) : (
                <GetStartedButton onClick={goToDashboard}>
                  Dashboard
                </GetStartedButton>
            )}
          </NavLinks>
        </GlassNav>
        <Main>
          <LeftContent>
            <AnimatedHeadlineWrapper>
              <AnimatedHeadline>
                {headlineText}
                <span style={{ color: "#2563eb", fontWeight: 900 }}>|</span>
              </AnimatedHeadline>
              <ShortBeautifulLine />
            </AnimatedHeadlineWrapper>
            <SubTitle>
              Take Control of Your Final Year Project—From Proposal to Evaluation
            </SubTitle>
            <GetStartedButton onClick={handleGetStarted} disabled={loading}>
              Login Now
            </GetStartedButton>
          </LeftContent>
        </Main>
        <HowItWorksSection />
        {assistant.show && (
          <AssistantContainer>
            <ChatBubble>{assistant.tip}</ChatBubble>
            <CapWithEyes>
              <AssistantCapImg src={capImg} alt="Assistant Cap" draggable={false} />
              <CapEyes>
                <Eye />
                <Eye />
              </CapEyes>
            </CapWithEyes>
          </AssistantContainer>
        )}
      </BgWrapper>
    </>
  );
};

export default LandingPage;