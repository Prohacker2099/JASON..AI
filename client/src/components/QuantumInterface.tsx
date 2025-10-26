import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Sphere, Box } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

interface QuantumInterfaceProps {
  state: string;
}

const QuantumInterface: React.FC<QuantumInterfaceProps> = ({ state }) => {
  const [quantumState, setQuantumState] = useState(state);
  const [qubits, setQubits] = useState(8);
  const [entanglement, setEntanglement] = useState(0.75);
  const [coherenceTime, setCoherenceTime] = useState(100);
  const [quantumVolume, setQuantumVolume] = useState(64);
  const [activeAlgorithm, setActiveAlgorithm] = useState<string | null>(null);

  const algorithms = [
    { id: 'shor', name: "Shor's Algorithm", description: 'Quantum factorization', complexity: 'O(log³n)' },
    { id: 'grover', name: "Grover's Algorithm", description: 'Quantum search', complexity: 'O(√n)' },
    { id: 'vqe', name: 'Variational Quantum Eigensolver', description: 'Quantum chemistry', complexity: 'O(n⁴)' },
    { id: 'qaoa', name: 'QAOA', description: 'Quantum optimization', complexity: 'O(n²)' }
  ];

  useEffect(() => {
    setQuantumState(state);
  }, [state]);

  return (
    <motion.div
      className="quantum-interface"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6 }}
    >
      <div className="quantum-header">
        <h2 className="quantum-title">Quantum Computing Interface</h2>
        <div className="quantum-status">
          <div className={`status-indicator ${quantumState}`}>
            {getQuantumIcon(quantumState)} {quantumState.toUpperCase()}
          </div>
          <div className="quantum-specs">
            {qubits} Qubits | Volume: {quantumVolume}
          </div>
        </div>
      </div>

      <div className="quantum-visualization-container">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <QuantumVisualization 
            state={quantumState}
            qubits={qubits}
            entanglement={entanglement}
            activeAlgorithm={activeAlgorithm}
          />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Canvas>
      </div>

      <div className="quantum-sidebar">
        <QuantumControls 
          qubits={qubits}
          setQubits={setQubits}
          entanglement={entanglement}
          setEntanglement={setEntanglement}
          coherenceTime={coherenceTime}
          setCoherenceTime={setCoherenceTime}
          onStateChange={setQuantumState}
        />
        <QuantumAlgorithms 
          algorithms={algorithms}
          activeAlgorithm={activeAlgorithm}
          setActiveAlgorithm={setActiveAlgorithm}
        />
        <QuantumMetrics 
          qubits={qubits}
          entanglement={entanglement}
          coherenceTime={coherenceTime}
          quantumVolume={quantumVolume}
        />
      </div>
    </motion.div>
  );
};

const QuantumVisualization: React.FC<{
  state: string;
  qubits: number;
  entanglement: number;
  activeAlgorithm: string | null;
}> = ({ state, qubits, entanglement, activeAlgorithm }) => {
  const groupRef = useRef<THREE.Group>(null);
  const qubitsRef = useRef<THREE.Group>(null);

  useFrame((frameState) => {
    if (groupRef.current) {
      if (state === 'superposition') {
        groupRef.current.rotation.y += 0.01;
        groupRef.current.rotation.x = Math.sin(frameState.clock.elapsedTime) * 0.1;
      } else if (state === 'entangled') {
        groupRef.current.rotation.y += 0.02;
        groupRef.current.rotation.z = Math.sin(frameState.clock.elapsedTime * 2) * 0.05;
      }
    }

    if (qubitsRef.current) {
      qubitsRef.current.children.forEach((qubit, index) => {
        const mesh = qubit as THREE.Mesh;
        if (state === 'superposition') {
          mesh.position.y = Math.sin(frameState.clock.elapsedTime * 2 + index) * 0.5;
        } else if (state === 'entangled') {
          mesh.rotation.x += 0.02;
          mesh.rotation.y += 0.01;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      
      {/* Quantum Field */}
      <QuantumField state={state} />
      
      {/* Qubits */}
      <group ref={qubitsRef}>
        <QubitArray qubits={qubits} state={state} />
      </group>
      
      {/* Entanglement Lines */}
      <EntanglementVisualization qubits={qubits} entanglement={entanglement} />
      
      {/* Algorithm Visualization */}
      {activeAlgorithm && <AlgorithmVisualization algorithm={activeAlgorithm} />}
      
      {/* Quantum Gates */}
      <QuantumGates />
    </group>
  );
};

const QuantumField: React.FC<{ state: string }> = ({ state }) => {
  const fieldRef = useRef<THREE.Mesh>(null);

  useFrame((frameState) => {
    if (fieldRef.current) {
      const material = fieldRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.2 + Math.sin(frameState.clock.elapsedTime * 3) * 0.1;
    }
  });

  const getFieldColor = () => {
    switch (state) {
      case 'superposition': return '#6600ff';
      case 'collapsed': return '#ff6600';
      case 'entangled': return '#ff0066';
      default: return '#0066ff';
    }
  };

  return (
    <mesh ref={fieldRef}>
      <sphereGeometry args={[8, 64, 64]} />
      <meshStandardMaterial
        color={getFieldColor()}
        emissive={getFieldColor()}
        emissiveIntensity={0.2}
        transparent
        opacity={0.1}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

const QubitArray: React.FC<{ qubits: number; state: string }> = ({ qubits, state }) => {
  const qubitElements = [];

  for (let i = 0; i < qubits; i++) {
    const angle = (i / qubits) * Math.PI * 2;
    const radius = 3;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    qubitElements.push(
      <group key={i} position={[x, 0, z]}>
        <Qubit index={i} state={state} />
      </group>
    );
  }

  return <>{qubitElements}</>;
};

const Qubit: React.FC<{ index: number; state: string }> = ({ index, state }) => {
  const qubitRef = useRef<THREE.Group>(null);

  useFrame((frameState) => {
    if (qubitRef.current) {
      if (state === 'superposition') {
        qubitRef.current.rotation.x += 0.02;
        qubitRef.current.rotation.y += 0.01;
      } else if (state === 'collapsed') {
        qubitRef.current.rotation.y += 0.005;
      }
    }
  });

  const getQubitColor = () => {
    switch (state) {
      case 'superposition': return '#00ffff';
      case 'collapsed': return '#ffffff';
      case 'entangled': return '#ff00ff';
      default: return '#888888';
    }
  };

  return (
    <group ref={qubitRef}>
      {/* Qubit Sphere */}
      <mesh>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial
          color={getQubitColor()}
          emissive={getQubitColor()}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Bloch Sphere Axes */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1]} rotation={[0, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.02, 0.02, 1]} rotation={[Math.PI / 2, 0, 0]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      
      {/* Qubit Label */}
      <Html distanceFactor={6}>
        <div className="qubit-label">Q{index}</div>
      </Html>
    </group>
  );
};

const EntanglementVisualization: React.FC<{ qubits: number; entanglement: number }> = ({ qubits, entanglement }) => {
  const linesRef = useRef<THREE.Group>(null);

  useFrame((frameState) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((line, index) => {
        const lineMesh = line as THREE.Line;
        const material = lineMesh.material as THREE.LineBasicMaterial;
        material.opacity = 0.3 + 0.4 * Math.sin(frameState.clock.elapsedTime * 2 + index) * entanglement;
      });
    }
  });

  const entanglementLines = [];
  const numConnections = Math.floor(qubits * entanglement);

  for (let i = 0; i < numConnections; i++) {
    const qubit1 = i % qubits;
    const qubit2 = (i + Math.floor(qubits / 2)) % qubits;
    
    const angle1 = (qubit1 / qubits) * Math.PI * 2;
    const angle2 = (qubit2 / qubits) * Math.PI * 2;
    const radius = 3;
    
    const x1 = Math.cos(angle1) * radius;
    const z1 = Math.sin(angle1) * radius;
    const x2 = Math.cos(angle2) * radius;
    const z2 = Math.sin(angle2) * radius;

    entanglementLines.push(
      <line key={`entanglement-${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([x1, 0, z1, x2, 0, z2])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff00ff" transparent opacity={0.5} />
      </line>
    );
  }

  return <group ref={linesRef}>{entanglementLines}</group>;
};

const AlgorithmVisualization: React.FC<{ algorithm: string }> = ({ algorithm }) => {
  const algorithmRef = useRef<THREE.Group>(null);

  useFrame((frameState) => {
    if (algorithmRef.current) {
      algorithmRef.current.rotation.y += 0.01;
    }
  });

  const getAlgorithmStructure = () => {
    switch (algorithm) {
      case 'shor':
        return <ShorVisualization />;
      case 'grover':
        return <GroverVisualization />;
      case 'vqe':
        return <VQEVisualization />;
      case 'qaoa':
        return <QAOAVisualization />;
      default:
        return null;
    }
  };

  return (
    <group ref={algorithmRef} position={[0, 2, 0]}>
      {getAlgorithmStructure()}
      <Html distanceFactor={8}>
        <div className="algorithm-label">
          {algorithm.toUpperCase()} Running
        </div>
      </Html>
    </group>
  );
};

const ShorVisualization: React.FC = () => (
  <group>
    {[...Array(5)].map((_, i) => (
      <mesh key={i} position={[i - 2, 0, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.3} />
      </mesh>
    ))}
  </group>
);

const GroverVisualization: React.FC = () => (
  <group>
    {[...Array(4)].map((_, i) => (
      <mesh key={i} position={[Math.cos(i * Math.PI / 2), 0, Math.sin(i * Math.PI / 2)]}>
        <octahedronGeometry args={[0.2]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.3} />
      </mesh>
    ))}
  </group>
);

const VQEVisualization: React.FC = () => (
  <group>
    <mesh>
      <torusGeometry args={[0.5, 0.1, 8, 16]} />
      <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={0.3} />
    </mesh>
  </group>
);

const QAOAVisualization: React.FC = () => (
  <group>
    {[...Array(6)].map((_, i) => (
      <mesh key={i} position={[Math.cos(i * Math.PI / 3) * 0.8, 0, Math.sin(i * Math.PI / 3) * 0.8]}>
        <tetrahedronGeometry args={[0.15]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.3} />
      </mesh>
    ))}
  </group>
);

const QuantumGates: React.FC = () => {
  const gates = [
    { name: 'H', position: [-4, 1, 0], color: '#00ffff' },
    { name: 'X', position: [-2, 1, 0], color: '#ff0000' },
    { name: 'Y', position: [0, 1, 0], color: '#00ff00' },
    { name: 'Z', position: [2, 1, 0], color: '#0000ff' },
    { name: 'CNOT', position: [4, 1, 0], color: '#ff00ff' }
  ];

  return (
    <group>
      {gates.map((gate, index) => (
        <group key={gate.name} position={gate.position}>
          <mesh>
            <boxGeometry args={[0.4, 0.4, 0.1]} />
            <meshStandardMaterial
              color={gate.color}
              emissive={gate.color}
              emissiveIntensity={0.2}
            />
          </mesh>
          <Html distanceFactor={4}>
            <div className="gate-label">{gate.name}</div>
          </Html>
        </group>
      ))}
    </group>
  );
};

const QuantumControls: React.FC<{
  qubits: number;
  setQubits: (qubits: number) => void;
  entanglement: number;
  setEntanglement: (entanglement: number) => void;
  coherenceTime: number;
  setCoherenceTime: (time: number) => void;
  onStateChange: (state: string) => void;
}> = ({ qubits, setQubits, entanglement, setEntanglement, coherenceTime, setCoherenceTime, onStateChange }) => {
  const quantumStates = ['superposition', 'collapsed', 'entangled'];

  return (
    <div className="quantum-controls-panel">
      <h3>Quantum Controls</h3>
      
      <div className="control-section">
        <h4>System Parameters</h4>
        
        <div className="control-group">
          <label>Qubits: {qubits}</label>
          <input
            type="range"
            min="2"
            max="16"
            value={qubits}
            onChange={(e) => setQubits(parseInt(e.target.value))}
            className="quantum-slider"
          />
        </div>
        
        <div className="control-group">
          <label>Entanglement: {(entanglement * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={entanglement}
            onChange={(e) => setEntanglement(parseFloat(e.target.value))}
            className="quantum-slider"
          />
        </div>
        
        <div className="control-group">
          <label>Coherence Time: {coherenceTime}μs</label>
          <input
            type="range"
            min="10"
            max="1000"
            value={coherenceTime}
            onChange={(e) => setCoherenceTime(parseInt(e.target.value))}
            className="quantum-slider"
          />
        </div>
      </div>

      <div className="control-section">
        <h4>Quantum States</h4>
        <div className="state-buttons">
          {quantumStates.map(state => (
            <button
              key={state}
              className="quantum-btn"
              onClick={() => onStateChange(state)}
            >
              {getQuantumIcon(state)} {state.charAt(0).toUpperCase() + state.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const QuantumAlgorithms: React.FC<{
  algorithms: any[];
  activeAlgorithm: string | null;
  setActiveAlgorithm: (algorithm: string | null) => void;
}> = ({ algorithms, activeAlgorithm, setActiveAlgorithm }) => {
  return (
    <div className="quantum-algorithms-panel">
      <h3>Quantum Algorithms</h3>
      
      <div className="algorithms-list">
        {algorithms.map(algorithm => (
          <motion.div
            key={algorithm.id}
            className={`algorithm-card ${activeAlgorithm === algorithm.id ? 'active' : ''}`}
            onClick={() => setActiveAlgorithm(activeAlgorithm === algorithm.id ? null : algorithm.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="algorithm-header">
              <div className="algorithm-name">{algorithm.name}</div>
              <div className="algorithm-complexity">{algorithm.complexity}</div>
            </div>
            <div className="algorithm-description">{algorithm.description}</div>
            {activeAlgorithm === algorithm.id && (
              <motion.div
                className="algorithm-status"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="status-indicator running">Running</div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const QuantumMetrics: React.FC<{
  qubits: number;
  entanglement: number;
  coherenceTime: number;
  quantumVolume: number;
}> = ({ qubits, entanglement, coherenceTime, quantumVolume }) => {
  const [metrics, setMetrics] = useState({
    fidelity: 0.95,
    errorRate: 0.001,
    gateTime: 20,
    readoutFidelity: 0.99
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        fidelity: Math.max(0.9, Math.min(0.99, prev.fidelity + (Math.random() - 0.5) * 0.01)),
        errorRate: Math.max(0.0001, Math.min(0.01, prev.errorRate + (Math.random() - 0.5) * 0.0001)),
        gateTime: Math.max(10, Math.min(50, prev.gateTime + (Math.random() - 0.5) * 2)),
        readoutFidelity: Math.max(0.95, Math.min(0.999, prev.readoutFidelity + (Math.random() - 0.5) * 0.001))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="quantum-metrics-panel">
      <h3>Quantum Metrics</h3>
      
      <div className="metrics-grid">
        <div className="metric-item">
          <div className="metric-label">Quantum Volume</div>
          <div className="metric-value">{quantumVolume}</div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">Fidelity</div>
          <div className="metric-value">{(metrics.fidelity * 100).toFixed(1)}%</div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">Error Rate</div>
          <div className="metric-value">{(metrics.errorRate * 100).toFixed(3)}%</div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">Gate Time</div>
          <div className="metric-value">{metrics.gateTime}ns</div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">Coherence</div>
          <div className="metric-value">{coherenceTime}μs</div>
        </div>
        
        <div className="metric-item">
          <div className="metric-label">Readout Fidelity</div>
          <div className="metric-value">{(metrics.readoutFidelity * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
};

const getQuantumIcon = (state: string) => {
  switch (state) {
    case 'superposition': return '⚛️';
    case 'collapsed': return '🔬';
    case 'entangled': return '🔗';
    default: return '⚡';
  }
};

export default QuantumInterface;
