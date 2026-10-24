import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  X, 
  Send, 
  Sparkles, 
  BookOpen, 
  Bot, 
  User as UserIcon, 
  Compass, 
  RotateCcw 
} from 'lucide-react';
import { apiClient } from '../api/client';

export const ChatDrawer = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 **Hi there! I am your StudyOrbit AI Tutor & Study Companion.**\n\nI can answer **any question** about your coursework, explain difficult concepts step-by-step, solve homework problems, summarize chapters from your textbooks, and guide your daily timetable.\n\nAsk me anything!`,
      citations: null,
      created_at: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: String(Date.now()),
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/chat/message', {
        message: text,
        session_id: sessionId
      });

      if (!sessionId) {
        setSessionId(response.session_id);
      }

      setMessages((prev) => [...prev, response]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: 'assistant',
          content: `⚠️ Failed to get guidance: ${err.message}`,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const quickPrompts = [
    "Explain Newton's third law with examples",
    "How does RAG differ from fine-tuning?",
    "Summarize Chapter 1 from my textbook",
    "Give me an active recall study technique"
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(3px)',
      zIndex: 60,
      display: 'flex',
      justifyContent: 'flex-end',
      transition: 'opacity 0.2s ease'
    }}>
      <div 
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          backgroundColor: 'var(--bg-card)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                StudyOrbit Chatbot
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>
                ● Online AI Tutor
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Thread */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isBot ? 'flex-start' : 'flex-end',
                }}
              >
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  maxWidth: '88%',
                  alignItems: 'flex-start'
                }}>
                  {isBot && (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <Bot size={16} />
                    </div>
                  )}

                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    backgroundColor: isBot ? 'var(--bg-card-subtle)' : 'var(--primary)',
                    color: isBot ? 'var(--text-primary)' : '#ffffff',
                    border: isBot ? '1px solid var(--border)' : 'none',
                    boxShadow: isBot ? 'var(--shadow-sm)' : 'none'
                  }}>
                    {isBot ? (
                      <div className="chat-markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    )}

                    {/* Citations block if available */}
                    {msg.citations?.matches && msg.citations.matches.length > 0 && (
                      <div style={{
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <span style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                          📚 Verified Coursework Citations:
                        </span>
                        {msg.citations.matches.map((cit, idx) => (
                          <div key={idx} style={{ 
                            background: 'var(--bg-card)', 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            border: '1px solid var(--border)',
                            marginTop: '3px'
                          }}>
                            {cit.subject} • {cit.chapter} (Pages {cit.pages})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <Bot size={18} color="var(--primary)" />
              <span>Thinking and crafting explanation...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          backgroundColor: 'var(--bg-card)'
        }}>
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(qp)}
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-card-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          gap: '8px'
        }}>
          <input
            type="text"
            className="input-field"
            placeholder="Ask anything about your courses, homework, or study plan..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            style={{ fontSize: '0.85rem' }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="btn btn-primary"
            style={{ padding: '0 16px', opacity: !inputText.trim() || isLoading ? 0.6 : 1 }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
