import React from 'react';
import AdaptiveLivingCard from './AdaptiveLivingCard';
import { useSmartHomeContext } from '../lib/SmartHomeContext';
import { DeviceType } from '../lib/types';

export interface AdaptiveCardData {
  id: string;
  type: 'lighting' | 'climate' | 'media' | 'security' | 'wellness' | 'productivity' | 'communication' | 'browser' | 'socialize';
  deviceType: DeviceType;
  onClick?: (deviceType: DeviceType) => void;
}

interface UniverseAtAGlanceProps {
  cards: AdaptiveCardData[];
}

const UniverseAtAGlance: React.FC<UniverseAtAGlanceProps> = ({ cards }) => {
  const { devices } = useSmartHomeContext();

  return (
    <div className="universe-at-a-glance">
      {cards.map(card => (
        <AdaptiveLivingCard
          key={card.id}
          deviceType={card.deviceType}
          devices={devices}
          onClick={card.onClick || (() => {})}
        />
      ))}
    </div>
  );
};

export default UniverseAtAGlance;