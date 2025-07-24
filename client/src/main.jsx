import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./styles/glassmorphism.css";

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  if (root) {
    ReactDOM.render(
      <React.StrictMode>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </React.StrictMode>,
      root,
    );
  } else {
    console.error("Root element not found");
  }
});
