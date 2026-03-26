import React, { useState } from 'react';
import { Search, Loader2, MapPin, Phone, Globe, Mail, Plus, Check, Tag, Settings2, X, CalendarClock, LayoutDashboard } from 'lucide-react';
import { Lead } from '../types';
import { searchBusinesses } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (id: string) => void;
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onStartCampaign: (leadIds: string[]) => void;
  className?: string;
}

export function Sidebar({ leads, selectedLeadId, onSelectLead, onAddLead, onUpdateLead, onStartCampaign, className }: SidebarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'search' | 'reminders'>('saved');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ old: string; new: string } | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setActiveTab('search');
    try {
      const results = await searchBusinesses(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback or error state could be added here
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveLead = (result: any) => {
    const newLead: Lead = {
      id: uuidv4(),
      name: result.name,
      address: result.address,
      phone: result.phone,
      website: result.website,
      email: result.email,
      status: 'new',
      tags: [],
      createdAt: Date.now(),
    };
    onAddLead(newLead);
    onSelectLead(newLead.id);
    setActiveTab('saved');
  };

  const [selectedForCampaign, setSelectedForCampaign] = useState<Set<string>>(new Set());

  const toggleCampaignSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedForCampaign);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedForCampaign(newSet);
  };

  const startCampaign = () => {
    if (selectedForCampaign.size === 0) return;
    onStartCampaign(Array.from(selectedForCampaign));
    setSelectedForCampaign(new Set());
  };

  const allTags = Array.from(new Set(leads.flatMap(l => l.tags))).sort();

  const handleRenameTag = (oldTag: string, newTag: string) => {
    if (!newTag.trim() || oldTag === newTag) return;
    leads.forEach(lead => {
      if (lead.tags.includes(oldTag)) {
        const updatedTags = lead.tags.map(t => t === oldTag ? newTag.trim() : t);
        onUpdateLead(lead.id, { tags: updatedTags });
      }
    });
    setEditingTag(null);
  };

  const handleDeleteTag = (tagToDelete: string) => {
    leads.forEach(lead => {
      if (lead.tags.includes(tagToDelete)) {
        onUpdateLead(lead.id, { tags: lead.tags.filter(t => t !== tagToDelete) });
      }
    });
  };

  const filteredLeads = selectedTagFilter 
    ? leads.filter(l => l.tags.includes(selectedTagFilter))
    : leads;

  return (
    <div className={cn("w-full md:w-80 flex-shrink-0 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col h-full", className)}>
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-white tracking-tight">OutreachOS</h1>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onSelectLead('')}
              className={cn(
                "p-2 rounded-lg transition-all",
                !selectedLeadId ? "bg-blue-500/20 text-blue-400" : "hover:bg-white/5 text-white/40 hover:text-white"
              )}
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsTagModalOpen(true)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
              title="Manage Tags"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search businesses (e.g. dentists in NY)"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
        </form>
      </div>

      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('saved')}
          className={cn(
            "flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors",
            activeTab === 'saved' ? "text-blue-400 border-b-2 border-blue-400" : "text-white/40 hover:text-white/60"
          )}
        >
          Saved ({filteredLeads.length})
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={cn(
            "flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5",
            activeTab === 'reminders' ? "text-blue-400 border-b-2 border-blue-400" : "text-white/40 hover:text-white/60"
          )}
        >
          <CalendarClock className="w-3.5 h-3.5" />
          Reminders
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={cn(
            "flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors",
            activeTab === 'search' ? "text-blue-400 border-b-2 border-blue-400" : "text-white/40 hover:text-white/60"
          )}
        >
          Search
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'search' ? (
          <div className="p-2 space-y-2">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">Searching Google Maps...</p>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result, i) => {
                const isSaved = leads.some(l => l.name === result.name && l.address === result.address);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-white text-sm line-clamp-1">{result.name}</h3>
                      <button
                        onClick={() => !isSaved && handleSaveLead(result)}
                        disabled={isSaved}
                        className={cn(
                          "p-1 rounded-md transition-colors",
                          isSaved ? "text-green-400" : "text-white/40 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/50 flex items-start gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{result.address}</span>
                    </p>
                    {result.phone && (
                      <p className="text-xs text-white/50 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {result.phone}
                      </p>
                    )}
                  </motion.div>
                );
              })
            ) : query && !isSearching ? (
              <div className="text-center py-8 text-white/40 text-sm">
                No results found. Try a different search.
              </div>
            ) : (
              <div className="text-center py-8 text-white/40 text-sm">
                Search for businesses to add them to your leads.
              </div>
            )}
          </div>
        ) : activeTab === 'reminders' ? (
          <div className="p-2 flex flex-col h-full">
            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1">
              {leads.filter(l => l.reminderDate).length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  <CalendarClock className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No upcoming reminders.
                </div>
              ) : (
                leads
                  .filter(l => l.reminderDate)
                  .sort((a, b) => (a.reminderDate || 0) - (b.reminderDate || 0))
                  .map((lead, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all border cursor-pointer relative group",
                      selectedLeadId === lead.id
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-transparent border-transparent hover:bg-white/5"
                    )}
                  >
                    <div className="pr-2">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-white text-sm truncate">{lead.name}</h3>
                        {lead.reminderDate && (
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 border",
                            lead.reminderDate < Date.now() 
                              ? "bg-red-500/10 text-red-400 border-red-500/20" 
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          )}>
                            <CalendarClock className="w-3 h-3" />
                            {new Date(lead.reminderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {lead.reminderNote && (
                        <p className="text-xs text-white/70 mt-1.5 bg-white/5 p-2 rounded-md border border-white/5 line-clamp-2">
                          {lead.reminderNote}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-2 flex flex-col h-full">
            {allTags.length > 0 && (
              <div className="px-1 mb-3 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setSelectedTagFilter(null)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors",
                    selectedTagFilter === null ? "bg-blue-500 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                  )}
                >
                  All
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTagFilter(tag === selectedTagFilter ? null : tag)}
                    className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors",
                      selectedTagFilter === tag ? "bg-blue-500 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            {selectedForCampaign.size > 0 && (
              <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                <span className="text-xs text-blue-400 font-medium">{selectedForCampaign.size} selected</span>
                <button 
                  onClick={startCampaign}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors"
                >
                  Start Campaign
                </button>
              </div>
            )}
            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  {selectedTagFilter ? `No leads with tag "${selectedTagFilter}"` : 'No saved leads yet.'}
                </div>
              ) : (
                filteredLeads.map((lead, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all border cursor-pointer relative group",
                      selectedLeadId === lead.id
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-transparent border-transparent hover:bg-white/5"
                    )}
                  >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <input 
                        type="checkbox" 
                        checked={selectedForCampaign.has(lead.id)}
                        onChange={() => {}} // Handled by onClick wrapper
                        onClick={(e) => toggleCampaignSelection(e, lead.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                      />
                    </div>
                    <div className="pr-6">
                      <h3 className="font-medium text-white text-sm truncate">{lead.name}</h3>
                      <p className="text-xs text-white/50 truncate mt-1">{lead.address}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full uppercase font-medium tracking-wider flex-shrink-0",
                          lead.status === 'new' ? "bg-blue-500/20 text-blue-400" :
                          lead.status === 'contacted' ? "bg-yellow-500/20 text-yellow-400" :
                          lead.status === 'interested' ? "bg-green-500/20 text-green-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {lead.status.replace('_', ' ')}
                        </span>
                        {lead.reminderDate && (
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 border",
                            lead.reminderDate < Date.now() 
                              ? "bg-red-500/10 text-red-400 border-red-500/20" 
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          )}>
                            <CalendarClock className="w-3 h-3" />
                            {new Date(lead.reminderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {lead.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/5 flex-shrink-0">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {/* Tag Management Modal */}
      <AnimatePresence>
        {isTagModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">Manage Tags</h2>
                </div>
                <button onClick={() => setIsTagModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {allTags.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No tags created yet.</p>
                    <p className="text-xs mt-1">Add tags to leads in the chat view.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allTags.map(tag => (
                      <div key={tag} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 group">
                        {editingTag?.old === tag ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              autoFocus
                              type="text"
                              value={editingTag.new}
                              onChange={(e) => setEditingTag({ ...editingTag, new: e.target.value })}
                              className="bg-white/10 border border-blue-500/50 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameTag(tag, editingTag.new);
                                if (e.key === 'Escape') setEditingTag(null);
                              }}
                            />
                            <button 
                              onClick={() => handleRenameTag(tag, editingTag.new)}
                              className="p-1.5 bg-blue-600 text-white rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-white/80 font-medium">{tag}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setEditingTag({ old: tag, new: tag })}
                                className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                              >
                                <Settings2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete the tag "${tag}" from all leads?`)) {
                                    handleDeleteTag(tag);
                                  }
                                }}
                                className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => setIsTagModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
