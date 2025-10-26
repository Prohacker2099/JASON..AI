import React from 'react';
import { Device, DeviceType } from '../lib/types';
import useHapticFeedback from '../hooks/useHapticFeedback';
import useAmbientSound from '../hooks/useAmbientSound';
import '../styles/AdaptiveLivingCard.css';
import '../styles/AdaptiveLivingCardAnimations.css';

interface AdaptiveLivingCardProps {
  deviceType: DeviceType;
  devices: Device[];
  onClick: (deviceType: DeviceType) => void;
}

const AdaptiveLivingCard: React.FC<AdaptiveLivingCardProps> = ({
  deviceType,
  devices,
}) => {
  const { triggerHapticFeedback } = useHapticFeedback();
  const { playSound } = useAmbientSound();

  const getCardData = () => {
    let title = '';
    let status = '';
    let icon = '';
    let className = '';
    let dynamicVisual: React.ReactNode | undefined = undefined;

    const device = devices.find(d => d.type === deviceType);

    switch (deviceType) {
      case DeviceType.LIGHT:
        title = 'Lighting';
        icon = '/assets/icons/lightbulb.svg';
        status = device?.state.on ? 'On' : 'Off';
        className = device?.state.on ? 'lighting-on' : '';
        dynamicVisual = device?.state.on ? (
          <svg className="dynamic-light-visual" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="8" fill="#FFD700" />
            <path d="M12 2L9 7h6L12 2z" fill="#FFD700" />
          </svg>
        ) : (
          <img src={icon} alt={title} />
        );
        break;
      case DeviceType.THERMOSTAT:
        title = 'Climate';
        icon = '/assets/icons/thermostat.svg';
        status = device?.state.temperature ? `${device.state.temperature}°C` : 'N/A';
        className = device?.state.mode === 'heating' ? 'climate-heating' : (device?.state.mode === 'cooling' ? 'climate-cooling' : '');
        dynamicVisual = (
          <svg className="dynamic-climate-visual" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3Z" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            {device?.state.temperature && device.state.temperature > 23 && <path d="M12 10l3-3h-6l3 3z" fill="red" />}
            {device?.state.temperature && device.state.temperature < 19 && <path d="M12 14l3 3h-6l3-3z" fill="blue" />}
          </svg>
        );
        break;
      case DeviceType.SPEAKER:
        title = 'Media';
        icon = '/assets/icons/speaker.svg';
        status = device?.state.on ? `Playing: ${device.state.playing || '...'}` : 'Off';
        className = device?.state.on ? 'media-playing-pulse' : '';
        dynamicVisual = device?.state.on ? (
          <svg className="dynamic-media-visual" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 10v4a2 2 0 0 0 2 2h3l5 4V2l-5 4H5a2 2 0 0 0-2 2z" />
            <path d="M17 8s4 2 4 6s-4 6-4 6" />
          </svg>
        ) : (
          <img src={icon} alt={title} />
        );
        break;
      case DeviceType.SECURITY_CAMERA:
      case DeviceType.SECURITY_SYSTEM:
        title = 'Security';
        icon = '/assets/icons/security.svg';
        status = device?.state.armed ? 'Armed' : (device?.state.motionDetected ? 'Motion Detected!' : 'Clear');
        className = device?.state.motionDetected ? 'security-alert-flash' : '';
        dynamicVisual = device?.state.motionDetected ? (
          <svg className="dynamic-security-visual" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" stroke="red" strokeWidth="2" fill="none" />
            <line x1="12" y1="8" x2="12" y2="16" stroke="red" strokeWidth="2" />
            <line x1="8" y1="12" x2="16" y2="12" stroke="red" strokeWidth="2" />
          </svg>
        ) : (
          <img src={icon} alt={title} />
        );
        break;
      case DeviceType.WELLNESS:
        title = 'Wellness';
        icon = '/assets/icons/heart.svg';
        status = device?.state.sleepScore ? `Sleep Score: ${device.state.sleepScore}` : 'N/A';
        className = device?.state.sleepScore ? 'wellness-active-flow' : '';
        dynamicVisual = (
          <svg className="dynamic-wellness-visual" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            {device?.state.heartRate && <text x="12" y="14" textAnchor="middle" fontSize="4" fill="white">{device.state.heartRate}</text>}
          </svg>
        );
        break;
      case DeviceType.PRODUCTIVITY:
        title = 'Productivity';
        icon = '/assets/icons/calendar.svg';
        status = device?.state.upcomingEvents?.length ? `${device.state.upcomingEvents.length} Upcoming Events` : 'No Events';
        className = device?.state.upcomingEvents?.length ? 'productivity-active-glow' : '';
        dynamicVisual = (
          <svg className="dynamic-productivity-visual" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            {device?.state.upcomingEvents && device.state.upcomingEvents.length > 0 && <circle cx="18" cy="7" r="2" fill="green" />}
          </svg>
        );
        break;
      case DeviceType.COMMUNICATION:
        title = 'Communication';
        icon = '/assets/icons/message.svg';
        status = `${device?.state.unreadMessages || 0} Unread, ${device?.state.missedCalls || 0} Missed Calls`;
        className = (device?.state.unreadMessages || 0) > 0 || (device?.state.missedCalls || 0) > 0 ? 'communication-unread-pulse' : '';
        dynamicVisual = (
          <svg className="dynamic-communication-visual" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            {(device?.state.unreadMessages || 0) > 0 && <circle cx="18" cy="6" r="3" fill="red" />}
            {(device?.state.missedCalls || 0) > 0 && <circle cx="6" cy="6" r="3" fill="orange" />}
          </svg>
        );
        break;
      case DeviceType.BROWSER:
        title = 'Browser';
        icon = '/assets/icons/browser.svg';
        status = device?.state.active ? 'Active' : 'Offline';
        className = device?.state.active ? 'browser-active-ripple' : '';
        dynamicVisual = (
          <svg className="dynamic-browser-visual" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="12" cy="12" r="4" fill="currentColor" />
          </svg>
        );
        break;
      case DeviceType.SENSOR:
        title = 'Sensors';
        icon = '/assets/icons/sensor.svg';
        status = device?.state.motion ? 'Motion Detected' : 'Clear';
        className = device?.state.motion ? 'security-alert-flash' : ''; // Reusing security alert for motion
        dynamicVisual = device?.state.motion ? (
          <svg className="dynamic-security-visual" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" stroke="orange" strokeWidth="2" fill="none" />
            <path d="M12 6v6l4 2" stroke="orange" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <img src={icon} alt={title} />
        );
        break;
      case DeviceType.CAR:
        title = 'Car';
        icon = '/assets/icons/car.svg';
        status = device?.state.battery ? `Battery: ${device.state.battery}%` : 'N/A';
        className = device?.state.preheating || device?.state.defrosted ? 'car-active-glow' : '';
        dynamicVisual = (
          <svg className="dynamic-car-visual" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 18H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z" />
            <circle cx="7" cy="12" r="1" />
            <circle cx="17" cy="12" r="1" />
            {device?.state.preheating && <path d="M12 4v-2" stroke="red" strokeWidth="2" />}
            {device?.state.defrosted && <path d="M12 20v2" stroke="blue" strokeWidth="2" />}
          </svg>
        );
        break;
      case DeviceType.COFFEE_MACHINE:
        title = 'Coffee';
        icon = '/assets/icons/coffee.svg';
        status = device?.state.brewing ? 'Brewing...' : (device?.state.on ? 'Ready' : 'Off');
        className = device?.state.brewing ? 'coffee-brewing-steam' : '';
        dynamicVisual = (
          <svg className="dynamic-coffee-visual" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
            {device?.state.brewing && <path d="M10 4l2-2 2 2" stroke="brown" strokeWidth="2" />}
          </svg>
        );
        break;
      case DeviceType.DOOR_LOCK:
        title = 'Door Lock';
        icon = '/assets/icons/lock.svg';
        status = device?.state.locked ? 'Locked' : 'Unlocked';
        className = device?.state.locked ? 'door-locked-secure' : 'door-unlocked-open';
        dynamicVisual = (
          <svg className="dynamic-doorlock-visual" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            {device?.state.locked ? (
              <circle cx="12" cy="16" r="2" fill="green" />
            ) : (
              <circle cx="12" cy="16" r="2" fill="red" />
            )}
          </svg>
        );
        break;
      case DeviceType.APPLIANCE:
        title = 'Appliance';
        icon = '/assets/icons/appliance.svg';
        status = device?.state.running ? `Running (${device.state.cycle})` : 'Off';
        className = device?.state.running ? 'appliance-running-spin' : '';
        dynamicVisual = (
          <svg className="dynamic-appliance-visual" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
            <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
            {device?.state.running && <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="2" />}
          </svg>
        );
        break;
      case DeviceType.MEDIA_PLAYER:
        title = 'Media Player';
        icon = '/assets/icons/media-player.svg';
        status = device?.state.on ? `Playing: ${device.state.playing || '...'}` : 'Off';
        className = device?.state.on ? 'media-playing-pulse' : ''; // Reusing media pulse
        dynamicVisual = (
          <svg className="dynamic-media-player-visual" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8" cy="8" r="2" />
            <circle cx="16" cy="16" r="2" />
            <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
        break;
      default:
        title = 'Unknown';
        icon = '/assets/icons/default.svg';
        status = 'N/A';
        break;
    }
    return { title, status, icon, className, dynamicVisual };
  };

  const { title, status, icon, className, dynamicVisual } = getCardData();

  return (
    <div className={`adaptive-living-card ${className}`} onClick={() => {
      onClick(deviceType);
      triggerHapticFeedback('light');
      playSound('click'); // Assuming a 'click' sound exists
    }}>
      <div className="card-icon">
        {dynamicVisual || <img src={icon} alt={title} />}
      </div>
      <div className="card-content">
        <h3>{title}</h3>
        <p>{status}</p>
      </div>
    </div>
  );
};

export default AdaptiveLivingCard;