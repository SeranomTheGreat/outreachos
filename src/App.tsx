/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Dashboard } from './components/Dashboard';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Lead, Message } from './types';

export default function App() {
  const [leads, setLeads] = useLocalStorage<Lead[]>('outreachos_leads', []);
  const [messages, setMessages] = useLocalStorage<Message[]>('outreachos_messages', []);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const handleAddLead = (lead: Lead) => {
    setLeads(prev => [lead, ...prev]);
  };

  const handleUpdateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleAddMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId) || null;

  const [campaignLeadIds, setCampaignLeadIds] = useState<string[]>([]);

  const handleStartCampaign = (leadIds: string[]) => {
    setCampaignLeadIds(leadIds);
    if (leadIds.length > 0) {
      setSelectedLeadId(leadIds[0]);
    }
  };

  const handleNextCampaignLead = () => {
    if (!selectedLeadId) return;
    const currentIndex = campaignLeadIds.indexOf(selectedLeadId);
    if (currentIndex >= 0 && currentIndex < campaignLeadIds.length - 1) {
      setSelectedLeadId(campaignLeadIds[currentIndex + 1]);
    } else {
      // Campaign finished
      setCampaignLeadIds([]);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden font-sans">
      <Sidebar 
        className={selectedLeadId ? "hidden md:flex" : "flex"}
        leads={leads} 
        selectedLeadId={selectedLeadId} 
        onSelectLead={setSelectedLeadId} 
        onAddLead={handleAddLead} 
        onUpdateLead={handleUpdateLead}
        onStartCampaign={handleStartCampaign}
      />
      {selectedLeadId ? (
        <ChatArea 
          className="flex"
          lead={selectedLead} 
          messages={messages} 
          onAddMessage={handleAddMessage} 
          onUpdateLead={handleUpdateLead}
          campaignLeadIds={campaignLeadIds}
          onNextCampaignLead={handleNextCampaignLead}
          onBack={() => setSelectedLeadId(null)}
        />
      ) : (
        <Dashboard 
          leads={leads} 
          messages={messages} 
          className="hidden md:flex"
        />
      )}
    </div>
  );
}
