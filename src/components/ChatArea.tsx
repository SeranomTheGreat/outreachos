import React, { useState, useRef, useEffect } from 'react';
import { Lead, Message } from '../types';
import { generateOutreachMessage } from '../services/geminiService';
import { Send, Sparkles, Phone, Globe, Mail, MapPin, Loader2, MessageSquare, ArrowLeft, Tag, X, Plus, CalendarClock, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';

interface ChatAreaProps {
  lead: Lead | null;
  messages: Message[];
  onAddMessage: (message: Message) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  campaignLeadIds: string[];
  onNextCampaignLead: () => void;
  onBack: () => void;
  className?: string;
}

export function ChatArea({ lead, messages, onAddMessage, onUpdateLead, campaignLeadIds, onNextCampaignLead, onBack, className }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState<'formal' | 'friendly' | 'premium'>('premium');
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderNote, setReminderNote] = useState('');
  const [reminderDays, setReminderDays] = useState('1');
  const [customDate, setCustomDate] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !newTag.trim()) return;
    if (lead.tags.includes(newTag.trim())) {
      setNewTag('');
      setIsAddingTag(false);
      return;
    }
    onUpdateLead(lead.id, { tags: [...lead.tags, newTag.trim()] });
    setNewTag('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!lead) return;
    onUpdateLead(lead.id, { tags: lead.tags.filter(t => t !== tagToRemove) });
  };

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

  const handleSetReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    
    let dateObj = new Date();
    if (reminderDays === 'custom' && customDate) {
      dateObj = new Date(customDate);
    } else {
      dateObj.setDate(dateObj.getDate() + parseInt(reminderDays));
    }
    
    onUpdateLead(lead.id, { 
      reminderDate: dateObj.getTime(),
      reminderNote: reminderNote.trim() || undefined
    });
    
    setIsReminderModalOpen(false);
    setReminderNote('');
    setReminderDays('1');
    setCustomDate('');
  };

  const handleClearReminder = () => {
    if (!lead) return;
    onUpdateLead(lead.id, { reminderDate: undefined, reminderNote: undefined });
    setIsReminderModalOpen(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      onUpdateLead(lead.id, { status: 'contacted' });
    }

    if (platform === 'whatsapp' && lead.phone) {
      const cleanPhone = lead.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(input)}`, '_blank');
    } else if (platform === 'email' && lead.email) {
      window.open(`mailto:${lead.email}?subject=Partnership Inquiry&body=${encodeURIComponent(input)}`, '_blank');
    }

    setInput('');

    // Auto-advance to next lead if in a campaign
    if (campaignLeadIds.length > 0) {
      onNextCampaignLead();
    }
  };

  return (
    <div className={cn("flex-1 flex flex-col h-full bg-[#0a0a0a] relative", className)}>
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl flex flex-col flex-shrink-0 z-10">
        <div className="h-20 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="md:hidden p-2 -ml-2 text-white/60 hover:text-white transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white truncate">{lead.name}</h2>
              <div className="flex items-center gap-4 mt-1 text-xs text-white/50">
                <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{lead.address}</span></span>
                {lead.phone && <span className="hidden sm:flex items-center gap-1 flex-shrink-0"><Phone className="w-3 h-3" /> {lead.phone}</span>}
                {lead.website && (
                  <a 
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1 flex-shrink-0 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Globe className="w-3 h-3" /> 
                    <span className="truncate max-w-[150px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-shrink-0 ml-2">
            {lead.phone && (
              <a
                href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
                className="p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium border bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                title="Call Business"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}
            <button
              onClick={() => {
                setReminderNote(lead?.reminderNote || '');
                setIsReminderModalOpen(true);
              }}
              className={cn(
                "p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium border",
                lead?.reminderDate && lead.reminderDate < Date.now() 
                  ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" 
                  : lead?.reminderDate 
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              )}
              title={lead?.reminderDate ? "Edit Reminder" : "Set Follow-up Reminder"}
            >
              <CalendarClock className="w-4 h-4" />
              <span className="hidden sm:inline">
                {lead?.reminderDate 
                  ? new Date(lead.reminderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : "Reminder"}
              </span>
            </button>
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
              onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as Lead['status'] })}
              className="bg-white/5 border border-white/10 text-white text-xs rounded-md px-2 md:px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>
        </div>
        
        {/* Tags Bar */}
        <div className="px-4 md:px-6 py-2 bg-white/5 flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
          <Tag className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          <div className="flex items-center gap-1.5">
            <AnimatePresence>
              {lead.tags.map((tag) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded-full border border-white/5 whitespace-nowrap"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            
            {isAddingTag ? (
              <form onSubmit={handleAddTag} className="flex items-center">
                <input
                  autoFocus
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onBlur={() => !newTag && setIsAddingTag(false)}
                  placeholder="Tag name..."
                  className="bg-white/10 border border-blue-500/50 text-white text-[10px] px-2 py-0.5 rounded-full focus:outline-none w-24"
                />
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingTag(true)}
                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors px-2 py-0.5"
              >
                <Plus className="w-3 h-3" /> Add Tag
              </button>
            )}
          </div>
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
      {/* Reminder Modal */}
      <AnimatePresence>
        {isReminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">Set Reminder</h2>
                </div>
                <button onClick={() => setIsReminderModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSetReminder} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">When to follow up?</label>
                  <select 
                    value={reminderDays}
                    onChange={(e) => setReminderDays(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="1">Tomorrow</option>
                    <option value="3">In 3 days</option>
                    <option value="7">In 1 week</option>
                    <option value="14">In 2 weeks</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>

                {reminderDays === 'custom' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-xs font-medium text-white/60 mb-1.5">Select Date</label>
                    <input 
                      type="date" 
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      required={reminderDays === 'custom'}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Note (Optional)</label>
                  <textarea 
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    placeholder="E.g., Ask about their new product launch..."
                    className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20 custom-scrollbar"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {lead?.reminderDate && (
                    <button 
                      type="button"
                      onClick={handleClearReminder}
                      className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="flex-[2] py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    Save Reminder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
