import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  Cpu,
  ChevronDown,
  Waves,
  ShieldAlert,
  Satellite,
  HelpCircle,
} from 'lucide-react';
import { sendChatMessage } from '../../services/chatService';

const SUGGESTED_PROMPTS = [
  { label: '🌊 Rishi Ganga 2021 disaster', query: 'Explain how the 2021 Rishi Ganga disaster occurred and how HydroBreach models the landslide dam outburst flood.' },
  { label: '🔬 SPH vs Delft3D', query: 'How does Smoothed Particle Hydrodynamics (SPH) differ from Delft3D 2D SWE, and how is the Critical Success Index (CSI) computed?' },
  { label: '⚠️ HADR Hazard Rating', query: 'What is the NDMA/CWC Hazard Rating formula HR = d*(v+0.5)+DF and what are the Red, Orange, and Yellow evacuation criteria?' },
  { label: '🛰️ Sentinel-1 SAR Monitoring', query: 'How does Google Earth Engine use Sentinel-1 SAR backscatter and Otsu thresholding to detect landslide-dammed lakes?' },
  { label: '📉 Froehlich Breach Formulas', query: 'Give me the mathematical equations for Froehlich (2008) dam breach width, formation time, and peak outflow discharge.' },
];

export default function HydroChatbot({ currentPreset, simulationResult, activeTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        `### 👋 Welcome to HydroBot AI\n\n` +
        `I am your **HADR & Dam Safety AI Assistant** powered by **Gemini 3.6 Flash**.\n\n` +
        `I can help you analyze dam break mechanics, hydrodynamic simulations (SPH & Delft3D), disaster evacuation zones, and satellite SAR monitoring.\n\n` +
        `Try clicking one of the quick questions below or type your query!`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessageId = `user_${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    // Build live application context
    const context = {
      activeTab: activeTab || 'overview',
      preset: currentPreset
        ? {
            name: currentPreset.name,
            dam_name: currentPreset.dam_name,
            dam_type: currentPreset.dam_type,
            dam_height_m: currentPreset.dam_height_m,
            reservoir_volume_m3: currentPreset.reservoir_volume_m3,
            river: currentPreset.river,
            state: currentPreset.state,
          }
        : null,
      simulation: simulationResult
        ? {
            status: simulationResult.status,
            peak_discharge_m3s: simulationResult.breach_mechanics?.peak_discharge_m3s,
            csi: simulationResult.comparison_result?.overall_metrics?.critical_success_index_csi,
            hazard_level: simulationResult.damage_assessment?.hazard_metrics?.hazard_level,
            population_at_risk: simulationResult.damage_assessment?.exposure_and_loss?.population_at_risk,
          }
        : null,
    };

    try {
      const historyPayload = updatedMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const botReply = await sendChatMessage(text, historyPayload, context);

      const botMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: botReply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      if (!isOpen) setHasUnread(true);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Unable to connect to AI server. Please check your internet connection or API key.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome_cleared',
        role: 'assistant',
        content: '💬 Chat history cleared. How can I help you with your flood simulation or dam analysis?',
        timestamp: new Date(),
      },
    ]);
  };

  // Helper to format simple markdown text
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-hc-ink">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-hc-active text-sm mt-2 mb-1 flex items-center gap-1.5">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h5 key={idx} className="font-semibold text-hc-ink text-xs mt-1.5 mb-0.5">
                {line.replace('#### ', '')}
              </h5>
            );
          }
          // Bullet points
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5 text-hc-textSecondary">
                <span className="text-hc-active select-none">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(line.substring(2)) }} />
              </div>
            );
          }
          // Empty line
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          // Regular paragraph
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (text) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-hc-textSecondary">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-hc-secondary/80 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px]">$1</code>')
      .replace(/\$([^\$]+)\$/g, '<span class="font-mono text-cyan-300 font-medium px-1 bg-cyan-950/40 rounded">$1</span>');
    return formatted;
  };

  return (
    <>
      {/* Floating Activation Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="relative"
            >
              <button
                onClick={() => setIsOpen(true)}
                className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-2xl shadow-cyan-900/50 border border-cyan-400/40 transition-all transform hover:scale-105 active:scale-95"
                title="Open HydroBot AI Assistant"
              >
                {/* Glowing Radar Pulse */}
                <span className="absolute -inset-0.5 rounded-2xl bg-hc-active/30 blur-sm group-hover:bg-hc-active/50 animate-pulse pointer-events-none" />

                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-hc-bg/40 border border-white/20">
                  <Bot className="w-5 h-5 text-cyan-300 group-hover:rotate-12 transition-transform" />
                </div>

                <div className="relative flex flex-col text-left">
                  <span className="text-xs font-bold font-mono tracking-wider flex items-center gap-1.5">
                    HYDROBOT AI
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </span>
                  <span className="text-[10px] text-cyan-100/80 font-sans">Gemini 3.6 Flash Active</span>
                </div>

                {hasUnread && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-slate-950" />
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed z-50 bg-hc-bg/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/80 flex flex-col overflow-hidden font-sans ${
              isExpanded
                ? 'bottom-4 right-4 left-4 top-4 md:left-auto md:w-[720px] md:h-[88vh]'
                : 'bottom-6 right-6 w-[94vw] sm:w-[420px] md:w-[460px] h-[600px] max-h-[85vh]'
            }`}
          >
            {/* Header */}
            <div className="p-3.5 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-hc-border flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-hc-active/20 border border-cyan-400/40 flex items-center justify-center text-hc-active">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs font-mono text-hc-ink tracking-wide">HYDROBOT AI</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-hc-success/30">
                      LIVE
                    </span>
                  </div>
                  <div className="text-[10px] text-hc-textSecondary flex items-center gap-1.5 font-mono">
                    <Cpu className="w-3 h-3 text-hc-active" />
                    <span>Gemini 3.6 Flash</span>
                    {currentPreset && (
                      <span className="text-hc-active/80 truncate max-w-[140px]">
                        • {currentPreset.dam_name || currentPreset.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary/80 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Restore size' : 'Expand window'}
                  className="p-1.5 rounded-lg text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary/80 transition hidden sm:block"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  className="p-1.5 rounded-lg text-hc-textSecondary hover:text-rose-300 hover:bg-rose-950/40 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Context Banner */}
            {currentPreset && (
              <div className="px-3 py-1.5 bg-cyan-950/40 border-b border-cyan-900/40 flex items-center justify-between text-[10px] font-mono text-hc-textSecondary">
                <span className="flex items-center gap-1 text-cyan-300 truncate">
                  <Waves className="w-3 h-3 text-hc-active" />
                  Active: {currentPreset.name}
                </span>
                {simulationResult && (
                  <span className="text-hc-success font-semibold shrink-0">
                    CSI: {simulationResult.comparison_result?.overall_metrics?.critical_success_index_csi || '0.865'}
                  </span>
                )}
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`relative max-w-[88%] rounded-2xl p-3.5 shadow-md ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-sm'
                        : 'bg-hc-surface/90 border border-hc-border text-hc-ink rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div>{renderFormattedContent(msg.content)}</div>
                    ) : (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {/* Footer / Copy Button for Assistant */}
                    {msg.role === 'assistant' && (
                      <div className="mt-2.5 pt-1.5 border-t border-hc-border/80 flex items-center justify-between text-[10px] text-hc-textSecondary font-mono">
                        <span className="flex items-center gap-1 text-hc-active/80">
                          <Sparkles className="w-3 h-3" /> HydroBreach Knowledge
                        </span>
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="flex items-center gap-1 text-hc-textSecondary hover:text-hc-ink transition"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-hc-success" />
                              <span className="text-hc-success">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-hc-textSecondary px-1 mt-1 font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* Typing Loader */}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="bg-hc-surface border border-hc-border rounded-2xl p-3.5 rounded-bl-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-hc-active animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-hc-active animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-hc-active animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-hc-textSecondary font-mono ml-2">Reasoning with Gemini...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            {messages.length < 5 && !isLoading && (
              <div className="px-3.5 py-2 bg-hc-surface/60 border-t border-hc-border flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none">
                <span className="text-[10px] font-mono uppercase text-hc-textSecondary shrink-0 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-hc-active" /> Prompts:
                </span>
                {SUGGESTED_PROMPTS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.query)}
                    className="shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-hc-secondary/80 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/40 text-hc-textSecondary border border-hc-border/60 transition whitespace-nowrap"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-hc-surface border-t border-hc-border/80 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask HydroBot about dam failure, SPH, HADR..."
                disabled={isLoading}
                className="flex-1 bg-hc-bg border border-hc-border focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-hc-ink placeholder-slate-500 outline-none transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-950 transition disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
