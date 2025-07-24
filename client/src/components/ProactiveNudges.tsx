import { useState, useEffect, useCallback } from 'react';
import { useWebSockets } from '../hooks/useWebSocket'; // Import WebSockets hook
import { Device } from '../lib/types'; // Import Device type

interface ProactiveNudgesState {
  lightsOn: boolean;
  temperature: number;
  securityStatus: 'armed' | 'disarmed';
  message: string;
}

interface ProactiveNudgesProps {
  deviceId: string;
}

const ProactiveNudges: React.FC<ProactiveNudgesProps> = ({ deviceId }) => {
  const [state, setState] = useState<ProactiveNudgesState>({
    lightsOn: false,
    temperature: 20,
    securityStatus: 'disarmed',
    message: '',
  });

  const { connect, sendMessage, receiveMessage } = useWebSockets();

  useEffect(() => {
    if (!connect) {
      return;
    }

    const subscription = connect.subscribe(deviceId, (data: Device) => {
      setState(data);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [connect, deviceId, receiveMessage]);

  const toggleLights = useCallback(() => {
    sendMessage(`devices/${deviceId}/light/toggle`);
  }, [deviceId, sendMessage]);

  const adjustTemperature = useCallback((newTemperature: number) => {
    sendMessage(`devices/${deviceId}/temperature/set`, { temperature: newTemperature });
  }, [deviceId, sendMessage]);

  const armSecurity = useCallback(() => {
    sendMessage(`devices/${deviceId}/security/arm`);
  }, [deviceId, sendMessage]);

  const disarmSecurity = useCallback(() => {
    sendMessage(`devices/${deviceId}/security/disarm`);
  }, [deviceId, sendMessage]);

  useEffect(() => {
    if (receiveMessage) {
      receiveMessage((message: string) => {
        setState((prevState) => ({ ...prevState, message: message }));
      });
    }
  }, [receiveMessage]);

  return (
    <div>
      <p>Proactive Nudges for {deviceId}</p>

      <button onClick={toggleLights}>Toggle Lights</button>

      <p>Temperature: {state.temperature}°C</p>
      <button onClick={() => adjustTemperature(state.temperature + 1)}>Increase Temp</button>
      <button onClick={() => adjustTemperature(state.temperature - 1)}>Decrease Temp</button>

      <p>Security Status: {state.securityStatus}</p>
      <button onClick={() => state.securityStatus === 'disarmed' ? armSecurity() : disarmSecurity()}>
        {state.securityStatus === 'disarmed' ? 'Arm Security' : 'Disarm Security'}
      </button>

      <p>{state.message}</p>
    </div>
  );
};

export default ProactiveNudges;
