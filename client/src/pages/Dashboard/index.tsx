import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FaMicrophone, FaBars, FaHome, FaRobot, FaChartLine, 
  FaShieldAlt, FaCloud, FaCompass, FaUserFriends, FaEnvelope 
} from 'react-icons/fa';
import { IoMdBrowsers } from 'react-icons/io';
import { RiCommunityLine } from 'react-icons/ri';


          />
        )}
      </div>

      {/* Dashboard Sections */}
      <section className="devices-section">
        <h2>Your Devices</h2>
        <div className="devices-grid">
          {devices.map(renderDeviceCard)}
        </div>
      </section>

      <section className="insights-section">
        <h2>Proactive Insights</h2>
        <div className="insights-grid">
          {insights.map(renderInsightCard)}
        </div>
      </section>

      <section className="communications-section">
        <h2>Communications</h2>
        <div className="communications-list">
          {communications.map(renderCommunicationCard)}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
