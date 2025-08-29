import React from "react";
import "./Loader.css";
import cap from "../assets/cap.png"; // Make sure cap.png is in src/assets

const Loader = () => (
  <div className="loader-overlay">
    <img src={cap} alt="Loading..." className="loader-spin" />
    <div className="loader-text">Loading</div>
  </div>
);

export default Loader;