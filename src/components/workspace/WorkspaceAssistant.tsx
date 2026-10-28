import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Check,
  Send,
  Settings,
  Sparkles,
  Key,
  X,
  RotateCcw,
  ListOrdered,
  Search,
  FlaskConical,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Server,
} from 'lucide-react';
import type { Challenge, BugAnswer, TestReport } from '../../types/round';
import type { WorkspaceStep } from './WorkspaceTopBar';
import { GemmaService, type ChatMessage, type GemmaApiStatus, DEFAULT_GEMMA_MODEL } from '../../lib/gemma';

export interface WorkspaceAssistantProps {
  roundTitle: string;
  entryFile: string;
  challenge: Challenge;
  currentStage: WorkspaceStep;
  markedBug: BugAnswer | null;
  testReport: TestReport | null;
  outputAnswer: string;
  outputCorrect: boolean;
  revealedOutput: string | null;
  locked: boolean;
}

export function WorkspaceAssistant({
  roundTitle,
  entryFile,
  challenge,
  currentStage,
  markedBug,
  testReport,
  outputAnswer,
  outputCorrect,
  revealedOutput,
  locked,
}: WorkspaceAssistantProps) {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I am **Gemma 4**, your interactive coding mentor. Ask me a question about the code, or click a quick action below to start your investigation.`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Server configuration status
  const [serverStatus, setServerStatus] = useState<GemmaApiStatus | null>(() => GemmaService.getCachedStatus());
  const [checkingStatus, setCheckingStatus] = useState(false);

  const streamEndRef = useRef<HTMLDivElement | null>(null);

  const refreshStatus = async () => {
    setCheckingStatus(true);
    const status = await GemmaService.checkServerStatus();
    setServerStatus(status);
    setCheckingStatus(false);
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || locked || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: queryText.trim() };
    const nextHistory = [...chatHistory, userMsg];
    setChatHistory(nextHistory);
    setChatInput('');
    setIsLoading(true);

    try {
      const mentorContext = {
        challenge,
        currentStage,
        markedBug,
        testReport,
        outputAnswer,
        outputCorrect,
        revealedOutput,
      };

      const reply = await GemmaService.sendChatMessage(nextHistory, mentorContext);
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Live AI guidance is currently unavailable: ${errMsg}. Please verify your network connection or API settings.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendQuery(chatInput);
  };

  const quickActions = [
    {
      label: 'Suggest procedure',
      icon: <ListOrdered size={12} />,
      query: 'Can you suggest an ordered investigation procedure for this challenge?',
    },
    {
      label: 'Trace data flow',
      icon: <Search size={12} />,
      query: `How should I trace the data flow from ${entryFile} to the service models?`,
    },
    {
      label: 'Interpret tests',
      icon: <FlaskConical size={12} />,
      query: 'Can you interpret our test execution results and what they imply?',
    },
    {
      label: 'Explain output',
      icon: <HelpCircle size={12} />,
      query: 'Can you explain why the program produces this output step by step?',
    },
  ];

  const isLive = Boolean(serverStatus?.configured);
  const activeModel = serverStatus?.model || DEFAULT_GEMMA_MODEL;

  return (
    <aside className="ws-assistant-panel">
      {/* Header */}
      <div className="ws-assistant-header">
        <div className="ws-assistant-title-group">
          <div className="ws-assistant-icon-square">
            <Bot size={16} />
          </div>
          <div>
            <div className="ws-assistant-main-title">Gemma 4 Mentor</div>
            <div className="ws-assistant-subtitle">Google AI Studio Guide</div>
          </div>
        </div>

        <div className="ws-assistant-header-actions">
          <button
            className={`ws-mentor-badge ${isLive ? 'active' : 'local'}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Google AI Studio Server Status"
          >
            <span className={`ws-status-dot ${isLive ? 'green' : 'violet'}`} />
            <span>{isLive ? 'Gemma 4 Online' : 'Gemma 4 Local'}</span>
          </button>
          <button
            className="ws-assistant-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Mentor Settings"
            title="API Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Settings Flyout Modal */}
      {showSettings && (
        <div className="ws-mentor-settings-panel">
          <div className="ws-settings-head">
            <div className="ws-settings-head-title">
              <Key size={13} />
              <span>Google AI Studio Configuration</span>
            </div>
            <button
              className="ws-settings-close-btn"
              onClick={() => setShowSettings(false)}
              aria-label="Close settings"
            >
              <X size={13} />
            </button>
          </div>

          <div className="ws-settings-body">
            <div className="ws-config-status-card">
              <div className="ws-config-row">
                <span className="ws-config-label">Provider</span>
                <span className="ws-config-value">Google AI Studio</span>
              </div>
              <div className="ws-config-row">
                <span className="ws-config-label">Model ID</span>
                <code className="ws-config-code">{activeModel}</code>
              </div>
              <div className="ws-config-row">
                <span className="ws-config-label">Connection</span>
                <span className={`ws-config-badge ${isLive ? 'online' : 'offline'}`}>
                  {isLive ? 'Live API Active' : 'Offline Mentor Mode'}
                </span>
              </div>
            </div>

            <div className="ws-config-security-note">
              <Server size={13} className="ws-note-icon" />
              <span>
                <strong>Secure Server-Side API:</strong> Keys are read on the server from <code>GEMINI_API_KEY</code> and never exposed in browser bundles or client requests.
              </span>
            </div>

            {!isLive && (
              <div className="ws-config-instructions">
                <div className="ws-inst-title">
                  <ShieldAlert size={13} />
                  <span>To enable live Google AI Studio requests:</span>
                </div>
                <ol className="ws-inst-steps">
                  <li>
                    Get an API key from{' '}
                    <a
                      href="https://aistudio.google.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ws-link-external"
                    >
                      aistudio.google.com/api-keys <ExternalLink size={10} />
                    </a>
                  </li>
                  <li>
                    Add <code>GEMINI_API_KEY=your_key_here</code> to your local <code>.env</code> file (or Vercel project settings).
                  </li>
                  <li>Restart your development server (<code>npm run dev</code>).</li>
                </ol>
              </div>
            )}

            <div className="ws-settings-actions">
              <button
                className="ws-btn ws-btn-quiet compact"
                onClick={refreshStatus}
                disabled={checkingStatus}
              >
                <RotateCcw size={12} className={checkingStatus ? 'spin' : ''} />
                <span>{checkingStatus ? 'Checking…' : 'Check Server Status'}</span>
              </button>
              <button
                className="ws-btn ws-btn-primary compact"
                onClick={() => setShowSettings(false)}
              >
                <Check size={12} />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Area */}
      <div className="ws-assistant-stream">
        {/* ROUND CONTEXT CARD */}
        <div className="ws-context-card">
          <div className="ws-context-meta-row">
            <span className="ws-context-tag">ROUND CONTEXT</span>
            <span className="ws-stage-badge">Stage: {currentStage}</span>
          </div>
          <div className="ws-context-title">
            {roundTitle} ({entryFile})
          </div>
          <div className="ws-context-warning">
            Interactive AI coding mentor. Ask questions or use the quick actions below to investigate the codebase.
          </div>
        </div>

        {/* Interactive Gemma Mentor Chat History */}
        {chatHistory.map((msg, idx) => (
          <div key={`chat-${idx}`} className={`ws-chat-bubble ${msg.role}`}>
            <div className="ws-bubble-header">
              <span className="ws-bubble-label">
                {msg.role === 'user' ? 'You' : 'Gemma 4 Mentor'}
              </span>
              {msg.role === 'assistant' && <Sparkles size={11} className="ws-bubble-icon" />}
            </div>
            <div className="ws-bubble-content">
              {msg.content.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx}>
                  {paragraph.split('\n').map((line, lIdx) => (
                    <span key={lIdx}>
                      {line}
                      {lIdx < paragraph.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="ws-chat-bubble assistant ws-thinking-bubble">
            <div className="ws-bubble-header">
              <span className="ws-bubble-label">Gemma 4 Mentor</span>
              <Sparkles size={11} className="ws-bubble-icon spin" />
            </div>
            <div className="ws-thinking-dots">
              <span>Thinking with Google AI Studio</span>
              <span className="dot dot-1">.</span>
              <span className="dot dot-2">.</span>
              <span className="dot dot-3">.</span>
            </div>
          </div>
        )}

        <div ref={streamEndRef} />
      </div>

      {/* Quick Action Suggestion Pills */}
      <div className="ws-quick-actions-bar">
        {quickActions.map((qa, idx) => (
          <button
            key={idx}
            className="ws-quick-action-pill"
            onClick={() => void sendQuery(qa.query)}
            disabled={locked || isLoading}
            title={qa.query}
          >
            {qa.icon}
            <span>{qa.label}</span>
          </button>
        ))}
      </div>

      {/* Bottom Chat Input */}
      <form className="ws-assistant-inputbar" onSubmit={handleFormSubmit}>
        <input
          type="text"
          className="ws-chat-input"
          placeholder="Ask Gemma about the code, tests, or workflow…"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          disabled={locked || isLoading}
        />
        <button
          type="submit"
          className="ws-chat-send-btn"
          disabled={locked || isLoading || !chatInput.trim()}
          aria-label="Send message"
        >
          <Send size={13} />
        </button>
      </form>
    </aside>
  );
}
