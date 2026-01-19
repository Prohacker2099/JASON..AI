import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Mic, Send, Zap, Brain, Activity, CheckCircle2, CircleDashed, X, ChevronRight, MessageSquareQuartette } from 'lucide-react';
import axios from 'axios';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background: #020408;
    color: #ffffff;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
  }
`;

const morphingGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  position: relative;
  align-items: center;
  justify-content: center;
`;

const AbstractBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  opacity: 0.15;
  pointer-events: none;
  background-image: 
    radial-gradient(circle at 20% 20%, #00f2fe 0%, transparent 40%),
    radial-gradient(circle at 80% 80%, #4facfe 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 60%);
  filter: blur(100px);
`;

const CommandBarWrapper = styled(motion.div)`
  width: 90%;
  max-width: 800px;
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 15px rgba(59, 130, 246, 0.2);
  border-radius: 24px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus-within {
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(30, 41, 59, 0.6);
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
    width: 95%;
  }
`;

const InputField = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 1.25rem;
  padding: 12px;
  outline: none;
  font-weight: 300;
  letter-spacing: 0.02em;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const IconButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const SendButton = styled(IconButton)`
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  border: none;

  &:hover {
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled(motion.div)`
  margin-top: 2rem;
  font-size: 0.875rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
`;

const ProgressMapContainer = styled(motion.div)`
  margin-top: 3rem;
  width: 90%;
  max-width: 1000px;
  height: 400px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 24px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
  z-index: 5;
`;

const TaskItem = styled(motion.div) <{ status: string }>`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: ${props => props.status === 'running' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  border-radius: 16px;
  margin-bottom: 12px;
  border: 1px solid ${props => props.status === 'running' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
`;

const TaskIcon = styled.div<{ status: string }>`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props =>
    props.status === 'completed' ? '#10b981' :
      props.status === 'running' ? '#3b82f6' :
        props.status === 'failed' ? '#ef4444' :
          'rgba(255,255,255,0.1)'
  };
  color: white;
`;

const TaskContent = styled.div`
  flex: 1;
`;

const TaskName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 4px;
`;

const TaskStatusText = styled.div`
  font-size: 0.8rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InteractionPanel = styled(motion.div)`
  position: fixed;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  background: #1e293b;
  border: 1px solid #3b82f6;
  border-radius: 20px;
  padding: 24px;
  z-index: 100;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.4);
`;

const Question = styled.div`
  font-size: 1.1rem;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const ActionButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 12px;
  
  &:hover { background: #2563eb; }
`;

const UniversalCommandCenter: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [interactionRequest, setInteractionRequest] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tasks]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setTasks([]);
    setActiveTask(null);

    try {
      const resp = await axios.post('/api/ghost/generic-task', { prompt: query });
      const taskId = resp.data.taskId;

      // Use SSE or Polling for status
      // For now, let's simulate the progress map updates if we don't have SSE hooked up fully
      monitorTask(taskId);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleInteraction = async (response: any) => {
    if (!activeTask || !interactionRequest) return;
    try {
      await axios.post(`/api/ghost/task/${activeTask.id}/interact`, { response });
      setInteractionRequest(null);
      // monitoring continues via interval
    } catch (e) {
      console.error('Interaction failed', e);
    }
  };

  const monitorTask = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const statusResp = await axios.get(`/api/ghost/task/${taskId}`);
        const taskObj = statusResp.data.task;
        const prompt = statusResp.data.interactionPrompt;

        if (taskObj.status === 'completed' || taskObj.status === 'failed') {
          clearInterval(interval);
          setIsProcessing(false);
        }

        // Interaction Handling
        if (taskObj.status === 'waiting_for_user' && prompt) {
          setInteractionRequest({
            id: prompt.id,
            message: prompt.rationale || prompt.title,
            options: prompt.options || ['Continue']
          });
        } else {
          setInteractionRequest(null);
        }

        // Map nested actions to flattened list for ProgressMap
        setTasks(taskObj.actions.map((a: any) => ({
          id: a.id,
          name: a.command || a.url || a.category,
          status: a.status || (taskObj.status === 'completed' ? 'completed' : 'pending'),
          type: a.type
        })));

        setActiveTask(taskObj);

      } catch (e) {
        console.error(e);
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 2000);
  };

  // ... (rest of component, until InteractionPanel)

  // Custom Input for text interaction
  const [interactionInput, setInteractionInput] = useState('');

  return (
    <>
      <GlobalStyle />
      <Container>
        <AbstractBackground />

        <CommandBarWrapper
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <IconButton
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Command size={20} />
          </IconButton>

          <InputField
            type="text"
            placeholder="What would you like JASON to do? (e.g. 'Project Math Homework', 'Edit my video', 'Organize my desktop', 'Design a 3D part')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />

          <IconButton
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Mic size={20} />
          </IconButton>

          <SendButton
            onClick={handleSubmit}
            disabled={isProcessing || !query.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={20} />
          </SendButton>
        </CommandBarWrapper>

        {isProcessing && (
          <StatusMessage
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CircleDashed size={16} className="animate-spin" />
            Processing your request...
          </StatusMessage>
        )}

        {tasks.length > 0 && (
          <ProgressMapContainer
            ref={scrollRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AnimatePresence>
              {tasks.map((task, idx) => (
                <TaskItem
                  key={task.id}
                  status={task.status}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <TaskIcon status={task.status}>
                    {task.status === 'completed' ? <CheckCircle2 size={16} /> :
                      task.status === 'running' ? <Activity size={16} /> :
                        <CircleDashed size={16} />}
                  </TaskIcon>
                  <TaskContent>
                    <TaskName>{task.name}</TaskName>
                    <TaskStatusText>{task.status}</TaskStatusText>
                  </TaskContent>
                </TaskItem>
              ))}
            </AnimatePresence>
          </ProgressMapContainer>
        )}

        {interactionRequest && (
          <InteractionPanel
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Brain size={24} color="#3b82f6" />
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Clarification Required</div>
            </div>
            <Question>{interactionRequest.message}</Question>

            {interactionRequest.options.includes('text_input') ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #3b82f6', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  value={interactionInput}
                  onChange={e => setInteractionInput(e.target.value)}
                  placeholder="Type your response..."
                />
                <ActionButton onClick={() => { handleInteraction(interactionInput); setInteractionInput('') }}>
                  SUBMIT
                </ActionButton>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                {interactionRequest.options.map((opt: string) => (
                  <ActionButton key={opt} onClick={() => handleInteraction(opt)}>
                    {opt.toUpperCase()}
                  </ActionButton>
                ))}
              </div>
            )}
          </InteractionPanel>
        )}
      </Container>
    </>
  );

};

export default UniversalCommandCenter;
