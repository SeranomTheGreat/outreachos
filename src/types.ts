export interface Lead {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  status: 'new' | 'contacted' | 'interested' | 'not_interested';
  tags: string[];
  createdAt: number;
  reminderDate?: number;
  reminderNote?: string;
}

export interface Message {
  id: string;
  leadId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Campaign {
  id: string;
  name: string;
  leadIds: string[];
  status: 'draft' | 'active' | 'completed';
  createdAt: number;
}
