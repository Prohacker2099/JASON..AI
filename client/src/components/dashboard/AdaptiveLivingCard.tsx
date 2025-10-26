import React from 'react';
import { motion } from 'framer-motion';
import { Device, DeviceType } from '../../lib/types';
import '../../styles/AdaptiveLivingCard.css';
import '../../styles/AdaptiveLivingCardAnimations.css';

interface AdaptiveLivingCardProps {
  deviceType: DeviceType;
  devices: Device[];
  onClick: (deviceType: DeviceType) => void;
}

const AdaptiveLivingCard: React.FC<AdaptiveLivingCardProps> = ({ deviceType, devices, onClick }) => {
  const getCardTitle = (type: DeviceType) => {
    switch (type) {
      case DeviceType.LIGHT: return 'Lighting';
      case DeviceType.THERMOSTAT: return 'Climate';
      case DeviceType.SPEAKER: return 'Media';
      case DeviceType.SECURITY_CAMERA: return 'Security';
      case DeviceType.WELLNESS: return 'Wellness';
      case DeviceType.PRODUCTIVITY: return 'Productivity';
      case DeviceType.COMMUNICATION: return 'Communication';
      case DeviceType.BROWSER: return 'Browser';
      default: return 'Devices';
    }
  };

  const getCardStateSummary = (type: DeviceType, devices: Device[]) => {
    const relevantDevices = devices.filter(d => d.type === type);
    switch (type) {
      case DeviceType.LIGHT:
        const lightsOn = relevantDevices.filter(d => d.state.on).length;
        return `${lightsOn} light${lightsOn === 1 ? '' : 's'} On`;
      case DeviceType.THERMOSTAT:
        const temp = relevantDevices[0]?.state.temperature;
        const mode = relevantDevices[0]?.state.mode;
        return temp !== undefined ? `${temp}°C ${mode ? mode + ' Mode' : ''}` : 'N/A';
      case DeviceType.SPEAKER:
        const playing = relevantDevices[0]?.state.playing;
        return playing ? `Playing: ${playing}` : 'Off';
      case DeviceType.SECURITY_CAMERA:
        const motionDetected = relevantDevices.some(d => d.state.motionDetected);
        return motionDetected ? 'Motion Detected!' : 'Clear';
      case DeviceType.WELLNESS:
        const sleepScore = relevantDevices[0]?.state.sleepScore;
        return sleepScore !== undefined ? `Sleep Score: ${sleepScore}` : 'N/A';
      case DeviceType.PRODUCTIVITY:
        const upcomingEvents = relevantDevices[0]?.state.upcomingEvents?.length;
        return upcomingEvents !== undefined ? `${upcomingEvents} Upcoming Event${upcomingEvents === 1 ? '' : 's'}` : 'No Events';
      case DeviceType.COMMUNICATION:
        const unreadMessages = relevantDevices[0]?.state.unreadMessages;
        const missedCalls = relevantDevices[0]?.state.missedCalls;
        return `${unreadMessages} Unread Messages, ${missedCalls} Missed Call${missedCalls === 1 ? '' : 's'}`;
      case DeviceType.BROWSER:
        return relevantDevices[0]?.state.active ? 'Active' : 'Inactive';
      default:
        return `${relevantDevices.length} devices`;
    }
  };

  const getCardDynamicVisualClass = (type: DeviceType, devices: Device[]) => {
    const relevantDevices = devices.filter(d => d.type === type);
    switch (type) {
      case DeviceType.LIGHT:
        return relevantDevices.some(d => d.state.on) ? 'light-on-glow' : '';
      case DeviceType.THERMOSTAT:
        const temp = relevantDevices[0]?.state.temperature;
        if (temp !== undefined && temp > 25) return 'climate-heat-wave';
        if (temp !== undefined && temp < 20) return 'climate-cool-breeze';
        return '';
      case DeviceType.SPEAKER:
        return relevantDevices.some(d => d.state.playing) ? 'media-playing-pulse' : '';
      case DeviceType.SECURITY_CAMERA:
        return relevantDevices.some(d => d.state.motionDetected) ? 'security-alert-flash' : '';
      case DeviceType.WELLNESS:
        const sleepScore = relevantDevices[0]?.state.sleepScore;
        return sleepScore && sleepScore > 7 ? 'wellness-active-flow' : '';
      case DeviceType.PRODUCTIVITY:
        const upcomingEvents = relevantDevices[0]?.state.upcomingEvents?.length;
        return upcomingEvents && upcomingEvents > 0 ? 'productivity-active-glow' : '';
      case DeviceType.COMMUNICATION:
        const unreadMessages = relevantDevices[0]?.state.unreadMessages;
        const missedCalls = relevantDevices[0]?.state.missedCalls;
        return (unreadMessages && unreadMessages > 0) || (missedCalls && missedCalls > 0) ? 'communication-unread-pulse' : '';
      case DeviceType.BROWSER:
        return relevantDevices[0]?.state.active ? 'browser-active-ripple' : '';
      default:
        return '';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className={`adaptive-living-card ${deviceType}-card ${getCardDynamicVisualClass(deviceType, devices)}`}
        onClick={() => onClick(deviceType)}
      >
        <h3>{getCardTitle(deviceType)}</h3>
        <p>{getCardStateSummary(deviceType, devices)}</p>
      </div>
    </motion.div>
  );
};

export default AdaptiveLivingCard;