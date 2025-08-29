import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RolesPage from "./components/RolesPage";
import AuthPortal from "./components/AuthPortal";
// import any other pages/components you need
import LandingPage from "./components/LandingPage"; // <-- Make sure you have this component

function App() {
  return (
    <Router>
      <Routes>
        {/* Show LandingPage at root (/) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/auth" element={<AuthPortal />} />
        {/* Add other routes here if needed */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;