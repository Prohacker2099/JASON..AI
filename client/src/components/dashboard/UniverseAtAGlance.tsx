import React from 'react';
import { motion } from 'framer-motion';
import { useSmartHomeContext } from '../../lib/SmartHomeContext';
import { DeviceType } from '../../lib/types';
import AdaptiveLivingCard from './AdaptiveLivingCard';
import '../../styles/UniverseAtAGlance.css';

interface UniverseAtAGlanceProps {
  onCardClick: (deviceType: DeviceType) => void;
}

const UniverseAtAGlance: React.FC<UniverseAtAGlanceProps> = ({ onCardClick }) => {
  const { devices } = useSmartHomeContext();

  const deviceTypesToShow = [
    DeviceType.LIGHT,
    DeviceType.THERMOSTAT,
    DeviceType.SPEAKER,
    DeviceType.SECURITY_CAMERA,
    DeviceType.WELLNESS,
    DeviceType.PRODUCTIVITY,
    DeviceType.COMMUNICATION,
    DeviceType.BROWSER,
  ];

  return (
    <div className="universe-at-a-glance">
      <h2>Your Universe At A Glance</h2>
      <div className="adaptive-living-cards-grid">
        {deviceTypesToShow.map((type) => (
          <AdaptiveLivingCard
            key={type}
            deviceType={type}
            devices={devices.filter(d => d.type === type)}
            onClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
};

export default UniverseAtAGlance;