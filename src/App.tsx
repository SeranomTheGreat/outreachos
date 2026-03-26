/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Lead, Message } from './types';

export default function App() {
  const [leads, setLeads] = useLocalStorage<Lead[]>('outreachos_leads', []);
  const [messages, setMessages] = useLocalStorage<Message[]>('outreachos_messages', []);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const handleAddLead = (lead: Lead) => {
    setLeads(prev => [lead, ...prev]);
  };

  const handleUpdateLeadStatus = (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
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
        onStartCampaign={handleStartCampaign}
      />
      <ChatArea 
        className={selectedLeadId ? "flex" : "hidden md:flex"}
        lead={selectedLead} 
        messages={messages} 
        onAddMessage={handleAddMessage} 
        onUpdateLeadStatus={handleUpdateLeadStatus}
        campaignLeadIds={campaignLeadIds}
        onNextCampaignLead={handleNextCampaignLead}
        onBack={() => setSelectedLeadId(null)}
      />
    </div>
  );
}
