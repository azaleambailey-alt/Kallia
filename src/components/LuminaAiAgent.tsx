import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TriggerMappingRule } from '../types.ts';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  Check,
  User,
  ArrowRight,
  Palette,
  Lightbulb,
} from 'lucide-react';

interface LuminaAiAgentProps {
  onApplySuggestedMapping: (
    eventKey: string,
    ruleUpdate: Partial<TriggerMappingRule>
  ) => Promise<void>;
  onTestTrigger: (triggerKey: string) => Promise<void>;
}

export const LuminaAiAgent: React.FC<LuminaAiAgentProps> = ({
  onApplySuggestedMapping,
  onTestTrigger,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### 👋 Hello! I'm Lumina, your Projection Mapping & Sensory Lighting AI Designer.

I specialize in designing circadian-friendly and high-impact visual cues for your home projection wall with **MadMapper**:

* **Baby Monitor**: Soothing, sleep-safe colors (Soft Lavender, Warm Peach, Dreamy Lilac) that alert parents without blinding the nursery or startling the baby.
* **Ring Doorbell**: Instant high-contrast alerts (Alert Crimson Red, Amber Flame) that draw immediate attention when someone is at your door.
* **Security System**: High-urgency perimeter scans (Caution Amber/Cyan, Emergency Red/White Strobe).

How would you like to customize your projection wall today?`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appliedKeys, setAppliedKeys] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    'Is there a MadMapper MCP that can connect and do this for me?',
    'Turn the projection red for someone at the door for me right now',
    'What colors should represent my baby waking up so it doesn’t disturb sleep?',
    'Set baby waking up to soothing lavender and trigger it for me',
    'How do I connect Claude Desktop or Cursor to MadMapper via MCP?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Parse out ```json:suggested_action ... ``` from assistant responses
  const parseActionBlock = (content: string) => {
    const regex = /```json:suggested_action\s*([\s\S]*?)\s*```/;
    const match = content.match(regex);
    if (!match) return { cleanedText: content, action: null };

    try {
      const action = JSON.parse(match[1]);
      const cleanedText = content.replace(regex, '').trim();
      return { cleanedText, action };
    } catch {
      return { cleanedText: content, action: null };
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          chatHistory: messages.slice(-5),
        }),
      });

      const data = await res.json();
      const reply = data.reply || "I've analyzed your setup and prepared recommendations.";

      const assistantMsg: ChatMessage = {
        id: 'asst_' + Date.now(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content:
            "I encountered an error connecting to the AI model. Let's make sure the backend is responding, or try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAction = async (msgId: string, action: any) => {
    if (!action?.eventKey) return;

    await onApplySuggestedMapping(action.eventKey, {
      primaryColor: action.primaryColor,
      secondaryColor: action.secondaryColor,
      animationPattern: action.animationPattern,
      madMapperCueName: action.madMapperCueName,
    });

    setAppliedKeys((prev) => ({ ...prev, [msgId]: true }));
    // Immediately test preview on wall
    await onTestTrigger(action.eventKey);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 flex flex-col h-[750px] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white leading-tight">
                Lumina AI Lighting & Projection Specialist
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive assistant for sensory color psychology & MadMapper OSC mapping
            </p>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const { cleanedText, action } = parseActionBlock(msg.content);
          const isApplied = appliedKeys[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-3 flex-1">
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none space-y-2'
                  }`}
                >
                  {/* Markdown-style paragraphs */}
                  <div className="whitespace-pre-line prose prose-invert prose-xs max-w-none">
                    {cleanedText}
                  </div>
                </div>

                {/* Interactive Action Card generated by Gemini */}
                {!isUser && action && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-950/40 border border-indigo-500/30 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Suggested Projection Scheme
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-300">
                        Event: {action.eventKey}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{action.explanation}</p>

                    {/* Color Swatches & Pattern Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span
                          className="w-4 h-4 rounded-full shadow"
                          style={{ backgroundColor: action.primaryColor }}
                        />
                        <span className="font-mono text-slate-300">{action.primaryColor}</span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span
                          className="w-4 h-4 rounded-full shadow"
                          style={{ backgroundColor: action.secondaryColor }}
                        />
                        <span className="font-mono text-slate-300">{action.secondaryColor}</span>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] capitalize font-medium">
                        Pattern: {action.animationPattern}
                      </span>
                    </div>

                    {/* Apply Button */}
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => handleApplyAction(msg.id, action)}
                        disabled={isApplied}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                          isApplied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Applied & Wall Tested!</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Apply to Wall & MadMapper</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Lumina is synthesizing lighting palette & MadMapper OSC cues...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto flex items-center gap-2 text-xs">
        <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">
          Try asking:
        </span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shrink-0 transition text-[11px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask Lumina: 'What colors represent baby waking up?' or 'Make doorbell bright red'..."
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-indigo-900/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
