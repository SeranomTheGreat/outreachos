import { useState, useRef, useEffect } from 'react';
import { Lead, Message } from '../types';
import { generateOutreachMessage } from '../services/geminiService';
import { Send, Sparkles, Phone, Globe, Mail, MapPin, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'motion/react';

interface ChatAreaProps {
  lead: Lead | null;
  messages: Message[];
  onAddMessage: (message: Message) => void;
  onUpdateLeadStatus: (id: string, status: Lead['status']) => void;
  campaignLeadIds: string[];
  onNextCampaignLead: () => void;
  onBack: () => void;
  className?: string;
}

export function ChatArea({ lead, messages, onAddMessage, onUpdateLeadStatus, campaignLeadIds, onNextCampaignLead, onBack, className }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState<'formal' | 'friendly' | 'premium'>('premium');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGenerate = async () => {
    if (isGenerating || !lead) return;
    setIsGenerating(true);
    try {
      const details = `Address: ${lead.address}\nPhone: ${lead.phone || 'N/A'}\nWebsite: ${lead.website || 'N/A'}`;
      const generatedMsg = await generateOutreachMessage(lead.name, details, tone, 'Initial outreach to offer our services.');
      setInput(generatedMsg);
    } catch (error) {
      console.error('Failed to generate message:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (lead && campaignLeadIds.includes(lead.id)) {
      const hasMessages = messages.some(m => m.leadId === lead.id);
      if (!hasMessages && !input && !isGenerating) {
        handleGenerate();
      }
    }
  }, [lead, campaignLeadIds, messages]);

  if (!lead) {
    return (
      <div className={cn("flex-1 flex flex-col items-center justify-center bg-black/20 text-white/40", className)}>
        <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-xl font-medium text-white/60">No Lead Selected</h2>
        <p className="text-sm mt-2">Select a lead from the sidebar to start outreach.</p>
      </div>
    );
  }

  const handleSend = (platform: 'whatsapp' | 'email' | 'internal') => {
    if (!input.trim()) return;

    const newMsg: Message = {
      id: uuidv4(),
      leadId: lead.id,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    onAddMessage(newMsg);
    
    if (lead.status === 'new') {
      onUpdateLeadStatus(lead.id, 'contacted');
    }

    if (platform === 'whatsapp' && lead.phone) {
      // Clean phone number (remove non-digits)
      const cleanPhone = lead.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(input)}`, '_blank');
    } else if (platform === 'email' && lead.email) {
      window.open(`mailto:${lead.email}?subject=Partnership Inquiry&body=${encodeURIComponent(input)}`, '_blank');
    }

    setInput('');
  };

  return (
    <div className={cn("flex-1 flex flex-col h-full bg-[#0a0a0a] relative", className)}>
      {/* Header */}
      <div className="h-20 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 text-white/60 hover:text-white transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{lead.name}</h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-white/50">
              <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{lead.address}</span></span>
              {lead.phone && <span className="hidden sm:flex items-center gap-1 flex-shrink-0"><Phone className="w-3 h-3" /> {lead.phone}</span>}
              {lead.website && <span className="hidden sm:flex items-center gap-1 flex-shrink-0"><Globe className="w-3 h-3" /> {lead.website}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-shrink-0 ml-2">
          {campaignLeadIds.length > 0 && (
            <button
              onClick={onNextCampaignLead}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors mr-1 md:mr-2 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Next Lead in Campaign</span>
              <span className="sm:hidden">Next</span>
            </button>
          )}
          <select 
            value={lead.status}
            onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value as Lead['status'])}
            className="bg-white/5 border border-white/10 text-white text-xs rounded-md px-2 md:px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="not_interested">Not Interested</option>
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.filter(m => m.leadId === lead.id).map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
          >
            <div className={cn(
              "max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-tr-sm" 
                : "bg-white/10 text-white/90 rounded-tl-sm border border-white/5"
            )}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <span className="text-[10px] opacity-50 mt-2 block text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 font-medium uppercase tracking-wider">AI Tone:</span>
              <select 
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="bg-transparent text-blue-400 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="formal" className="bg-gray-900">Formal</option>
                <option value="friendly" className="bg-gray-900">Friendly</option>
                <option value="premium" className="bg-gray-900">Premium</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isGenerating ? 'Generating...' : 'Generate Message'}
            </button>
          </div>
          
          <div className="relative flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl p-2 focus-within:border-white/20 focus-within:bg-white/10 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message or generate one with AI..."
              className="w-full bg-transparent text-white text-sm resize-none max-h-48 min-h-[44px] p-3 focus:outline-none custom-scrollbar"
              rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 8) : 1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend('internal');
                }
              }}
            />
            <div className="flex flex-col gap-2 pb-1 pr-1">
              {lead.phone && (
                <button
                  onClick={() => handleSend('whatsapp')}
                  disabled={!input.trim()}
                  className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Send via WhatsApp"
                >
                  <Phone className="w-4 h-4" />
                </button>
              )}
              {lead.email && (
                <button
                  onClick={() => handleSend('email')}
                  disabled={!input.trim()}
                  className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Send via Email"
                >
                  <Mail className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleSend('internal')}
                disabled={!input.trim()}
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Save Note"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
