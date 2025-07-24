import React, { useState, useEffect, useRef } from 'react';
import { useSmartHomeContext } from '../../context/SmartHomeContext';
import { Device, DeviceStatus } from '../../types/SmartHomeTypes';

interface QuickActionsCarouselProps {
  devices: Device[];
}

const QuickActionsCarousel: React.FC<QuickActionsCarouselProps> = ({ devices }) => {
  const { dispatch, state } = useSmartHomeContext();
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
    dispatch({
      type: 'DEVICE_ACTION',
      payload: { device },
    });
  };

  return (
    <div className="quick-actions-carousel" ref={carouselRef}>
      {devices.map((device) => (
        <div
          key={device.id}
          className="quick-action"
          onClick={() => handleAction(device)}
        >
          {device.name} - {device.status}
        </div>
      ))}
    </div>
  );
};

export default QuickActionsCarousel;
