import { useState } from 'react';
import { Bot, Check, Send, ShieldCheck } from 'lucide-react';
import type { Interaction } from '../../types/round';

export interface AssistantMessageItem {
  id?: string;
  text: string;
  pointsTo?: string;
}

export interface WorkspaceAssistantProps {
  roundTitle: string;
  entryFile: string;
  messages: AssistantMessageItem[];
  interactions: Interaction[];
  onRecordChoice: (messageText: string, choice: 'trust' | 'verify', pointsTo?: string) => void;
  onSelectTarget: (targetPath: string) => void;
  locked: boolean;
}

export function WorkspaceAssistant({
  roundTitle,
  entryFile,
  messages,
  interactions,
  onRecordChoice,
  onSelectTarget,
  locked,
}: WorkspaceAssistantProps) {
  const [chatInput, setChatInput] = useState('');
  const [customMessages, setCustomMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || locked) return;
    const userText = chatInput.trim();
    setChatInput('');
    setCustomMessages(prev => [...prev, { sender: 'user', text: userText }]);

    // Simulated deterministic response
    setTimeout(() => {
      setCustomMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: `Compare the operations in ${entryFile} with the data models in app/. Trace how identifiers are formatted before storage vs lookup.`,
        },
      ]);
    }, 350);
  };

  return (
    <aside className="ws-assistant-panel">
      {/* Header */}
      <div className="ws-assistant-header">
        <div className="ws-assistant-title-group">
          <div className="ws-assistant-icon-square">
            <Bot size={16} />
          </div>
          <div>
            <div className="ws-assistant-main-title">Assistant</div>
            <div className="ws-assistant-subtitle">Scripted demo hint · Deterministic</div>
          </div>
        </div>
        <span className="ws-local-badge">Local</span>
      </div>

      {/* Stream Area */}
      <div className="ws-assistant-stream">
        {/* ROUND CONTEXT CARD */}
        <div className="ws-context-card">
          <span className="ws-context-tag">ROUND CONTEXT</span>
          <div className="ws-context-title">
            {roundTitle} ({entryFile})
          </div>
          <div className="ws-context-warning">
            Decoys may point to correct modules. Trust or verify critically.
          </div>
        </div>

        {/* Stacked Assistant Message Cards */}
        {messages.map((msg, idx) => {
          const recorded = [...interactions].reverse().find(it => it.message === msg.text);
          return (
            <div key={idx} className="ws-assistant-card">
              <div className="ws-card-header">
                <span className="ws-card-label">Gemma Assistant</span>
                {recorded && (
                  <span className={`ws-decision-chip ${recorded.choice}`}>
                    {recorded.choice === 'trust' ? 'Trusted' : 'Verified'}
                  </span>
                )}
              </div>

              <p className="ws-card-body">{msg.text}</p>

              {msg.pointsTo && (
                <div className="ws-card-target">
                  <span>Target: </span>
                  <button
                    className="ws-target-btn"
                    onClick={() => onSelectTarget(msg.pointsTo!)}
                    title="Click to view file"
                  >
                    <code>{msg.pointsTo}</code>
                  </button>
                </div>
              )}

              <div className="ws-card-actions">
                <button
                  className={`ws-btn ws-btn-trust ${recorded?.choice === 'trust' ? 'selected' : ''}`}
                  onClick={() => onRecordChoice(msg.text, 'trust', msg.pointsTo)}
                  disabled={locked}
                >
                  <Check size={13} />
                  <span>Trust</span>
                </button>
                <button
                  className={`ws-btn ws-btn-verify ${recorded?.choice === 'verify' ? 'selected' : ''}`}
                  onClick={() => onRecordChoice(msg.text, 'verify', msg.pointsTo)}
                  disabled={locked}
                >
                  <ShieldCheck size={13} />
                  <span>Verify</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Additional custom messages from chat */}
        {customMessages.map((msg, idx) => (
          <div key={`chat-${idx}`} className={`ws-chat-bubble ${msg.sender}`}>
            <span className="ws-bubble-label">{msg.sender === 'user' ? 'You' : 'Assistant'}</span>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Bottom Chat Input */}
      <form className="ws-assistant-inputbar" onSubmit={handleSend}>
        <input
          type="text"
          className="ws-chat-input"
          placeholder="Ask a question about the code…"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          disabled={locked}
        />
        <button
          type="submit"
          className="ws-chat-send-btn"
          disabled={locked || !chatInput.trim()}
          aria-label="Send message"
        >
          <Send size={13} />
        </button>
      </form>
    </aside>
  );
}
