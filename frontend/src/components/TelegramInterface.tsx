'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Radio } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

interface TelegramInterfaceProps {
  onCommandExecuted?: (state: any) => void;
  backendConnected?: boolean;
}

export default function TelegramInterface({ onCommandExecuted, backendConnected }: TelegramInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'bot',
      text: "🤖 *ADAS Guardian Cyber Controller Bot* initialized.\n\nType `/status` to run diagnostics or click a quick action command below.",
      timestamp: '12:00 PM'
    }
  ]);
  const [inputVal, setInputVal] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickCommands = [
    { cmd: '/status', label: '📊 Status' },
    { cmd: '/location', label: '📍 Location' },
    { cmd: '/lock', label: '🔒 Lock/Unlock' },
    { cmd: '/siren', label: '🚨 Alarm Siren' },
    { cmd: '/sos', label: '🆘 SOS Alert' }
  ];

  // Send Command Handler
  const sendCommand = async (cmdString: string) => {
    if (!cmdString.trim()) return;

    // 1. Add User Command Message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: cmdString,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');

    // 2. Resolve Response
    if (backendConnected) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/vehicle/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmdString })
        });
        const data = await res.json();
        
        // Add Bot Reply Message
        const botReply: ChatMessage = {
          id: Math.random().toString(),
          sender: 'bot',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botReply]);
        if (onCommandExecuted) {
          onCommandExecuted(data.state);
        }
      } catch (err) {
        console.error('Telegram API error, processing locally:', err);
        handleLocalCommand(cmdString);
      }
    } else {
      handleLocalCommand(cmdString);
    }
  };

  // Local Command Resolver (Fallback)
  const handleLocalCommand = (cmdString: string) => {
    let reply = '';
    const cleanCmd = cmdString.trim().toLowerCase();
    let statusUpdate: any = {};

    if (cleanCmd === '/status') {
      reply = `🤖 *ADAS Guardian Status Report (Local Simulator)*
🚗 *Vehicle ID:* CAR-2035
🔋 *Health Score:* 100%
⚠️ *Threat Level:* MINIMAL
🛡️ *GPS Security:* 100%
🛡️ *Network State:* SECURE
🔒 *Security Lock:* UNLOCKED
🚨 *Siren:* OFF
🚦 *ADAS Sensors:* Active`;
    } else if (cleanCmd === '/location') {
      reply = `📍 *Vehicle Location Ping*
🚗 *Vehicle ID:* CAR-2035
📡 *Coordinates:* \`17.385000, 78.486700\`
🧭 *Heading:* North-East
⚡ *Speed:* 65 km/h
🔗 [Open in Google Maps](https://www.google.com/maps/search/?api=1&query=17.3850,78.4867)`;
    } else if (cleanCmd === '/lock') {
      reply = `🔒 *Remote Command Executive*
Vehicle lock status toggled to: *LOCKED*`;
      statusUpdate = { remoteLockState: 'LOCKED' };
    } else if (cleanCmd === '/siren') {
      reply = `🚨 *Security Siren Override*
Siren has been manually turned *ON*.`;
      statusUpdate = { sirenState: 'ON' };
    } else if (cleanCmd === '/sos') {
      reply = `🚨 *EMERGENCY SOS RECEIVED*
⚠️ Alerting closest emergency response crew...
📍 *Location:* \`17.385000, 78.486700\`
🏥 Hospital Trauma ER notified. Safe tracking active.`;
      statusUpdate = { threatLevel: 'HIGH', emergencyReadiness: 'DEPLOYED' };
    } else {
      reply = `🤖 Bot command unrecognized. Available commands:
/status - Check diagnostics
/location - GPS tracking ping
/lock - Toggle smart entry locking
/siren - Trigger siren alert
/sos - Dispatch medical emergency`;
    }

    setTimeout(() => {
      const botReply: ChatMessage = {
        id: Math.random().toString(),
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botReply]);
      if (onCommandExecuted && Object.keys(statusUpdate).length > 0) {
        onCommandExecuted(statusUpdate);
      }
    }, 850);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendCommand(inputVal);
    }
  };

  // Convert markdown to clean HTML tags inside mockup bubble
  const parseMarkdown = (text: string) => {
    let formatted = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-black/5 px-1.5 py-0.5 rounded border border-black/10 text-brand-primary text-[11px] font-mono">$1</code>');
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-brand-primary hover:underline">$1</a>');
    formatted = formatted.split('\n').join('<br/>');

    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-brand-card border border-brand-primary/10 rounded-2xl overflow-hidden shadow-xl">
      {/* Bot Chat Header */}
      <div className="bg-[#f2f2f7] p-4 border-b border-brand-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary/10 border border-brand-primary/20 p-2.5 rounded-full text-brand-primary shadow-sm">
            <Bot className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-brand-text text-sm md:text-base">ADAS Guardian Bot</h4>
            <p className="text-[10px] md:text-xs text-brand-secondary font-mono">
              {backendConnected ? '● Online & Sync' : '○ Standalone Mockup'}
            </p>
          </div>
        </div>
        <Radio className={`h-4 w-4 ${backendConnected ? 'text-brand-secondary animate-ping' : 'text-brand-subtext'}`} />
      </div>

      {/* Message History Scroller - light mode iOS style */}
      <div className="h-80 overflow-y-auto p-4 space-y-4 bg-brand-bg/50">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${isBot ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
            >
              <div className={`p-2 rounded-full border ${isBot ? 'bg-[#e5e5ea] border-black/5 text-brand-subtext' : 'bg-brand-primary/10 border-brand-primary/25 text-brand-primary'}`}>
                {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </div>
              <div>
                <div className={`p-3 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm ${
                  isBot 
                    ? 'bg-white text-brand-text rounded-tl-none border border-black/5' 
                    : 'bg-brand-primary text-white rounded-tr-none'
                }`}>
                  {parseMarkdown(msg.text)}
                </div>
                <span className="text-[9px] text-brand-subtext mt-1 block font-mono">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Action buttons */}
      <div className="p-3 border-t border-brand-primary/5 bg-[#f2f2f7]/55 flex flex-wrap gap-2 justify-center">
        {quickCommands.map((item) => (
          <button
            key={item.cmd}
            onClick={() => sendCommand(item.cmd)}
            className="bg-white hover:bg-gray-100 text-brand-primary border border-brand-primary/10 hover:border-brand-primary/30 rounded-lg px-3 py-1.5 text-xs font-mono transition-all shadow-sm"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Chat Keyboard Entry form */}
      <div className="p-4 bg-[#f2f2f7] border-t border-brand-primary/10 flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type command (e.g. /status, /lock, /siren)..."
          className="flex-1 bg-white border border-brand-primary/20 focus:border-brand-primary rounded-xl px-4 py-2 text-xs md:text-sm text-brand-text outline-none transition-all font-mono shadow-sm"
        />
        <button
          onClick={() => sendCommand(inputVal)}
          className="bg-brand-primary text-white hover:bg-[#0052cc] p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
