import React, { useState } from 'react';
import { Search, Loader2, MapPin, Phone, Globe, Mail, Plus, Check } from 'lucide-react';
import { Lead } from '../types';
import { searchBusinesses } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SidebarProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (id: string) => void;
  onAddLead: (lead: Lead) => void;
  onStartCampaign: (leadIds: string[]) => void;
  className?: string;
}

export function Sidebar({ leads, selectedLeadId, onSelectLead, onAddLead, onStartCampaign, className }: SidebarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'search'>('saved');

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

  return (
    <div className={cn("w-full md:w-80 flex-shrink-0 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col h-full", className)}>
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-semibold text-white mb-4 tracking-tight">OutreachOS</h1>
        
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
          Saved Leads ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={cn(
            "flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors",
            activeTab === 'search' ? "text-blue-400 border-b-2 border-blue-400" : "text-white/40 hover:text-white/60"
          )}
        >
          Search Results
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
        ) : (
          <div className="p-2 flex flex-col h-full">
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
              {leads.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  No saved leads yet.
                </div>
              ) : (
                leads.map((lead, idx) => (
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
                      <div className="flex gap-2 mt-2">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full uppercase font-medium tracking-wider",
                          lead.status === 'new' ? "bg-blue-500/20 text-blue-400" :
                          lead.status === 'contacted' ? "bg-yellow-500/20 text-yellow-400" :
                          lead.status === 'interested' ? "bg-green-500/20 text-green-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
