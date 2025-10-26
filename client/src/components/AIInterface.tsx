import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Sphere, Box } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

const AIInterface: React.FC = () => {
  const [aiState, setAiState] = useState<'idle' | 'processing' | 'learning' | 'predicting'>('idle');
  const [neuralActivity, setNeuralActivity] = useState(0);
  const [predictions, setPredictions] = useState([
    { id: 1, type: 'energy', confidence: 94, prediction: 'Peak usage at 18:30', timestamp: new Date() },
    { id: 2, type: 'maintenance', confidence: 87, prediction: 'HVAC filter replacement in 5 days', timestamp: new Date() },
    { id: 3, type: 'optimization', confidence: 92, prediction: '15% energy savings possible', timestamp: new Date() }
  ]);
  const [learningProgress, setLearningProgress] = useState(67);

  useEffect(() => {
    const interval = setInterval(() => {
      setNeuralActivity(Math.random() * 100);
      setLearningProgress(prev => Math.min(100, prev + Math.random() * 0.5));
      
      // Simulate AI state changes
      const states: typeof aiState[] = ['idle', 'processing', 'learning', 'predicting'];
      setAiState(states[Math.floor(Math.random() * states.length)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="ai-interface"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6 }}
    >
      <div className="ai-header">
        <h2 className="ai-title">AI Brain Interface</h2>
        <div className="ai-status">
          <div className={`status-indicator ${aiState}`}>
            {aiState.toUpperCase()}
          </div>
          <div className="neural-activity">
            Neural Activity: {neuralActivity.toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="ai-brain-container">
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
          <AIBrainVisualization 
            state={aiState}
            activity={neuralActivity}
            learningProgress={learningProgress}
          />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Canvas>
      </div>

      <div className="ai-sidebar">
        <AIPredictions predictions={predictions} />
        <AILearningProgress progress={learningProgress} />
        <AIControls onStateChange={setAiState} />
      </div>
    </motion.div>
  );
};

const AIBrainVisualization: React.FC<{
  state: string;
  activity: number;
  learningProgress: number;
}> = ({ state, activity, learningProgress }) => {
  const brainRef = useRef<THREE.Group>(null);
  const neuronsRef = useRef<THREE.Group>(null);

  useFrame((frameState) => {
    if (brainRef.current) {
      brainRef.current.rotation.y += 0.005;
      brainRef.current.rotation.x = Math.sin(frameState.clock.elapsedTime * 0.5) * 0.1;
    }

    if (neuronsRef.current) {
      neuronsRef.current.children.forEach((neuron, index) => {
        const mesh = neuron as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;
        
        const pulse = Math.sin(frameState.clock.elapsedTime * 3 + index) * 0.5 + 0.5;
        material.emissiveIntensity = (activity / 100) * pulse * 0.8;
        
        mesh.scale.setScalar(1 + pulse * 0.2 * (activity / 100));
      });
    }
  });

  return (
    <group>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      
      {/* Central Brain Core */}
      <group ref={brainRef}>
        <mesh>
          <sphereGeometry args={[2, 32, 32]} />
          <meshStandardMaterial
            color="#ff00ff"
            emissive="#6600ff"
            emissiveIntensity={0.3}
            transparent
            opacity={0.6}
            wireframe={state === 'processing'}
          />
        </mesh>
        
        {/* Neural Network */}
        <group ref={neuronsRef}>
          <NeuralNetwork activity={activity} state={state} />
        </group>
        
        {/* Data Streams */}
        <DataStreams state={state} />
        
        {/* Learning Visualization */}
        <LearningVisualization progress={learningProgress} />
      </group>
      
      {/* AI State Indicator */}
      <Html distanceFactor={10} position={[0, 3, 0]}>
        <div className="ai-state-display">
          <div className={`state-badge ${state}`}>
            {getStateIcon(state)} {state.toUpperCase()}
          </div>
        </div>
      </Html>
    </group>
  );
};

const NeuralNetwork: React.FC<{ activity: number; state: string }> = ({ activity, state }) => {
  const neurons = [];
  const connections = [];

  // Create neurons in layers
  for (let layer = 0; layer < 4; layer++) {
    const neuronsInLayer = 8 - layer;
    for (let i = 0; i < neuronsInLayer; i++) {
      const angle = (i / neuronsInLayer) * Math.PI * 2;
      const radius = 2.5 + layer * 0.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (layer - 2) * 0.8;

      neurons.push(
        <mesh key={`neuron-${layer}-${i}`} position={[x, y, z]}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial
            color={state === 'learning' ? '#00ff00' : '#00ffff'}
            emissive={state === 'learning' ? '#00ff00' : '#00ffff'}
            emissiveIntensity={0.5}
          />
        </mesh>
      );

      // Create connections to next layer
      if (layer < 3) {
        const nextLayerNeurons = 8 - (layer + 1);
        for (let j = 0; j < nextLayerNeurons; j++) {
          const nextAngle = (j / nextLayerNeurons) * Math.PI * 2;
          const nextRadius = 2.5 + (layer + 1) * 0.5;
          const nextX = Math.cos(nextAngle) * nextRadius;
          const nextY = Math.sin(nextAngle) * nextRadius;
          const nextZ = ((layer + 1) - 2) * 0.8;

          connections.push(
            <line key={`connection-${layer}-${i}-${j}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([x, y, z, nextX, nextY, nextZ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color="#00ffff"
                transparent
                opacity={0.3 + (activity / 100) * 0.4}
              />
            </line>
          );
        }
      }
    }
  }

  return (
    <group>
      {neurons}
      {connections}
    </group>
  );
};

const DataStreams: React.FC<{ state: string }> = ({ state }) => {
  const streamRef = useRef<THREE.Group>(null);

  useFrame((frameState) => {
    if (streamRef.current) {
      streamRef.current.rotation.z += 0.02;
    }
  });

  const streams = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * 4;
    const y = Math.sin(angle) * 4;

    streams.push(
      <group key={`stream-${i}`} position={[x, y, 0]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 2]} />
          <meshBasicMaterial
            color={state === 'processing' ? '#ffff00' : '#00ffff'}
            transparent
            opacity={0.7}
          />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <coneGeometry args={[0.05, 0.2]} />
          <meshBasicMaterial
            color={state === 'processing' ? '#ffff00' : '#00ffff'}
          />
        </mesh>
      </group>
    );
  }

  return <group ref={streamRef}>{streams}</group>;
};

const LearningVisualization: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <group position={[0, -3, 0]}>
      <Html distanceFactor={8}>
        <div className="learning-progress-3d">
          <div className="progress-label">Learning Progress</div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-value">{progress.toFixed(1)}%</div>
        </div>
      </Html>
    </group>
  );
};

const AIPredictions: React.FC<{ predictions: any[] }> = ({ predictions }) => {
  return (
    <div className="ai-predictions-panel">
      <h3>AI Predictions</h3>
      <div className="predictions-list">
        {predictions.map(prediction => (
          <motion.div
            key={prediction.id}
            className={`prediction-card ${prediction.type}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="prediction-header">
              <div className="prediction-type">
                {getPredictionIcon(prediction.type)} {prediction.type.toUpperCase()}
              </div>
              <div className="confidence-badge">
                {prediction.confidence}%
              </div>
            </div>
            <div className="prediction-content">
              {prediction.prediction}
            </div>
            <div className="prediction-timestamp">
              {prediction.timestamp.toLocaleTimeString()}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const AILearningProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const [modelStats, setModelStats] = useState({
    accuracy: 94.2,
    loss: 0.08,
    epochs: 1247,
    dataPoints: 15420
  });

  return (
    <div className="ai-learning-panel">
      <h3>Learning Progress</h3>
      
      <div className="progress-overview">
        <div className="progress-circle">
          <svg width="120" height="120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#00ffff"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(progress / 100) * 314} 314`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="progress-text">
            <div className="progress-percent">{progress.toFixed(1)}%</div>
            <div className="progress-label">Complete</div>
          </div>
        </div>
      </div>

      <div className="model-stats">
        <div className="stat-item">
          <span className="stat-label">Accuracy:</span>
          <span className="stat-value">{modelStats.accuracy}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Loss:</span>
          <span className="stat-value">{modelStats.loss}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Epochs:</span>
          <span className="stat-value">{modelStats.epochs}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Data Points:</span>
          <span className="stat-value">{modelStats.dataPoints.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const AIControls: React.FC<{ onStateChange: (state: any) => void }> = ({ onStateChange }) => {
  const [autoMode, setAutoMode] = useState(true);
  const [learningRate, setLearningRate] = useState(0.001);

  const triggerPrediction = () => {
    onStateChange('predicting');
    setTimeout(() => onStateChange('idle'), 3000);
  };

  const startLearning = () => {
    onStateChange('learning');
    setTimeout(() => onStateChange('idle'), 5000);
  };

  const processData = () => {
    onStateChange('processing');
    setTimeout(() => onStateChange('idle'), 2000);
  };

  return (
    <div className="ai-controls-panel">
      <h3>AI Controls</h3>
      
      <div className="control-section">
        <h4>Actions</h4>
        <button className="ai-btn primary" onClick={triggerPrediction}>
          🔮 Generate Predictions
        </button>
        <button className="ai-btn secondary" onClick={startLearning}>
          🧠 Start Learning
        </button>
        <button className="ai-btn secondary" onClick={processData}>
          ⚡ Process Data
        </button>
      </div>

      <div className="control-section">
        <h4>Settings</h4>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={autoMode}
            onChange={(e) => setAutoMode(e.target.checked)}
          />
          <span className="slider">Auto Mode</span>
        </label>
        
        <div className="setting-group">
          <label>Learning Rate: {learningRate}</label>
          <input
            type="range"
            min="0.0001"
            max="0.01"
            step="0.0001"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            className="setting-slider"
          />
        </div>
      </div>

      <div className="control-section">
        <h4>Model Management</h4>
        <button className="ai-btn success full-width">
          💾 Save Model
        </button>
        <button className="ai-btn warning full-width">
          📥 Load Model
        </button>
        <button className="ai-btn danger full-width">
          🔄 Reset Training
        </button>
      </div>
    </div>
  );
};

const getStateIcon = (state: string) => {
  switch (state) {
    case 'idle': return '😴';
    case 'processing': return '⚡';
    case 'learning': return '🧠';
    case 'predicting': return '🔮';
    default: return '🤖';
  }
};

const getPredictionIcon = (type: string) => {
  switch (type) {
    case 'energy': return '⚡';
    case 'maintenance': return '🔧';
    case 'optimization': return '📈';
    case 'security': return '🔒';
    default: return '📊';
  }
};

export default AIInterface;
