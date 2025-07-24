import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CrossDevice from "./pages/CrossDevice";

const App = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cross-device" element={<CrossDevice />} />
      </Routes>
    </div>
  );
};

export default App;
