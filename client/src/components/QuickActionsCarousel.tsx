import React, { useState, useEffect, useRef } from 'react';
import { useSmartHomeContext } from '../lib/SmartHomeContext';
import { Device, DeviceState } from '../lib/types';

interface QuickActionsCarouselProps {
  devices: Device[];
}

const QuickActionsCarousel: React.FC<QuickActionsCarouselProps> = ({ devices }) => {
  const { dispatch, updateDeviceState } = useSmartHomeContext();
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (carouselRef.current) {
      // Initial carousel positioning
      carouselRef.current.style.left = '0';
    }
  }, []);

  const handleAction = (device: Device) => {
    // Simulate action - Replace with actual device control logic
    console.log(`Executing action for device: ${device.name}`);
    // For demonstration, toggle the 'on' state if it exists, otherwise set a generic 'active' state
    const newState: DeviceState = { on: !device.state.on };
    updateDeviceState({ deviceId: device.id, newState });
  };

  return (
    <div className="quick-actions-carousel" ref={carouselRef}>
      {devices.map((device) => (
        <div
          key={device.id}
          className="quick-action"
          onClick={() => handleAction(device)}
        >
          {device.name} - {device.state.on ? 'On' : 'Off'}
        </div>
      ))}
    </div>
  );
};

export default QuickActionsCarousel;
