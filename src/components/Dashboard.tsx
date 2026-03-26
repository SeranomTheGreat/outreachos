import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, MessageSquare, Target, CalendarClock, TrendingUp, Activity } from 'lucide-react';
import { Lead, Message } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DashboardProps {
  leads: Lead[];
  messages: Message[];
  className?: string;
}

export function Dashboard({ leads, messages, className }: DashboardProps) {
  // Calculate stats
  const totalLeads = leads.length;
  const contactedLeads = leads.filter(l => l.status !== 'new').length;
  const interestedLeads = leads.filter(l => l.status === 'interested').length;
  const upcomingReminders = leads.filter(l => l.reminderDate && l.reminderDate > Date.now()).length;
  
  const conversionRate = contactedLeads > 0 ? Math.round((interestedLeads / contactedLeads) * 100) : 0;
  
  // Last 7 days chart data
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const startOfDay = d.getTime();
      const endOfDay = startOfDay + 86400000;
      
      const dayMessages = messages.filter(m => m.timestamp >= startOfDay && m.timestamp < endOfDay && m.role === 'user').length;
      const dayLeads = leads.filter(l => l.createdAt >= startOfDay && l.createdAt < endOfDay).length;
      
      data.push({
        name: d.toLocaleDateString(undefined, { weekday: 'short' }),
        messages: dayMessages,
        leads: dayLeads,
      });
    }
    return data;
  }, [leads, messages]);

  const StatCard = ({ title, value, icon: Icon, trend, subtitle, delay }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/60 font-medium text-sm">{title}</h3>
        <div className="p-2 bg-white/5 rounded-lg text-blue-400">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {trend && (
          <span className="text-xs font-medium text-green-400 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-white/40 mt-2">{subtitle}</p>}
    </motion.div>
  );

  return (
    <div className={cn("flex-1 flex flex-col bg-[#0a0a0a] overflow-y-auto custom-scrollbar", className)}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-white/50 mt-2">Track your outreach performance and lead conversion.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Leads" 
            value={totalLeads} 
            icon={Users} 
            subtitle="Saved in your pipeline"
            delay={0.1}
          />
          <StatCard 
            title="Contacted" 
            value={contactedLeads} 
            icon={MessageSquare} 
            subtitle={`${Math.round((contactedLeads / (totalLeads || 1)) * 100)}% of total leads`}
            delay={0.2}
          />
          <StatCard 
            title="Interested" 
            value={interestedLeads} 
            icon={Target} 
            trend={`${conversionRate}%`}
            subtitle="Conversion from contacted"
            delay={0.3}
          />
          <StatCard 
            title="Upcoming Reminders" 
            value={upcomingReminders} 
            icon={CalendarClock} 
            subtitle="Follow-ups scheduled"
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Outreach Activity</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="messages" name="Messages Sent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">New Leads Added</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="leads" name="Leads Added" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
