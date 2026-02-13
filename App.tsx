
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  User, 
  UserRole, 
  Equipment, 
  Booking, 
  EquipmentStatus, 
  BookingStatus 
} from './types';
import { INITIAL_EQUIPMENT, Icons, ENGINEERING_DEPARTMENTS } from './constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { getLabAssistantInsights } from './geminiService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Helper Components
const Badge = ({ status, isOverdue }: { status: string, isOverdue?: boolean }) => {
  if (isOverdue) {
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-600 text-white animate-pulse">
        OVERDUE
      </span>
    );
  }
  const colors: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800',
    IN_USE: 'bg-blue-100 text-blue-800',
    MAINTENANCE: 'bg-red-100 text-red-800',
    BOOKED: 'bg-yellow-100 text-yellow-800',
    PENDING: 'bg-orange-100 text-orange-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-gray-100 text-gray-800',
    COMPLETED: 'bg-purple-100 text-purple-800',
  };
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

interface WhatsAppLog {
  id: string;
  to: string;
  message: string;
  timestamp: string;
  status: 'QUEUED' | 'SENDING' | 'DELIVERED' | 'FAILED';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'bookings' | 'admin' | 'analytics' | 'assistant'>('inventory');
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEqForDetails, setSelectedEqForDetails] = useState<Equipment | null>(null);
  
  // Track notified overdue bookings to prevent duplicate alerts
  const notifiedOverdueRef = useRef<Set<string>>(new Set());

  // WhatsApp Gateway State
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>([]);
  const [whatsappNotification, setWhatsappNotification] = useState<{message: string, to: string, status: 'sending' | 'delivered', link: string} | null>(null);

  // New Booking Form State
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [bookingTarget, setBookingTarget] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    facultyName: '',
    department: '',
    whatsappNumber: '',
    purpose: '',
    startDate: '',
    endDate: ''
  });

  // Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const calculateFine = (endTime: string, status: BookingStatus) => {
    if (status !== BookingStatus.APPROVED) return 0;
    const now = new Date();
    const end = new Date(endTime);
    if (now > end) {
      const diffTime = Math.abs(now.getTime() - end.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return (diffDays + 1) * 50; // $50 fine per day overdue
    }
    return 0;
  };

  // REAL-TIME ENGINE: Simulate equipment status updates and trigger OVERDUE alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      // 1. Update Equipment Status
      setEquipment(prevEquipment => 
        prevEquipment.map(item => {
          if (item.status === EquipmentStatus.MAINTENANCE) return item;
          
          const activeBooking = bookings.find(b => 
            b.equipmentId === item.id && 
            b.status === BookingStatus.APPROVED &&
            new Date(b.startTime) <= now &&
            new Date(b.endTime) >= now
          );

          return {
            ...item,
            status: activeBooking ? EquipmentStatus.IN_USE : EquipmentStatus.AVAILABLE
          };
        })
      );

      // 2. Automated Overdue Alerting System
      bookings.forEach(booking => {
        const fine = calculateFine(booking.endTime, booking.status);
        if (fine > 0 && !notifiedOverdueRef.current.has(booking.id)) {
          const eq = equipment.find(e => e.id === booking.equipmentId);
          const alertMsg = `⚠️ OVERDUE ALERT: Hi ${booking.facultyName}, your access to ${eq?.name} has expired. A fine of $${fine} has been generated. Please return it immediately to avoid further charges.`;
          
          triggerWhatsAppAlert(booking.whatsappNumber, alertMsg);
          notifiedOverdueRef.current.add(booking.id);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [bookings, equipment]);

  const triggerWhatsAppAlert = (to: string, message: string) => {
    const waLink = `https://wa.me/${to.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    
    // UI Overlay Notification
    setWhatsappNotification({
      to,
      message,
      status: 'sending',
      link: waLink
    });

    // Push to System Logs
    const logId = 'wa-alert-' + Math.random().toString(36).substr(2, 9);
    setWhatsappLogs(logs => [{
      id: logId,
      to,
      message,
      timestamp: new Date().toISOString(),
      status: 'SENDING'
    }, ...logs]);

    // Simulate Network Success
    setTimeout(() => {
      setWhatsappNotification(n => n ? { ...n, status: 'delivered' } : null);
      setWhatsappLogs(logs => logs.map(l => l.id === logId ? { ...l, status: 'DELIVERED' } : l));
      setTimeout(() => setWhatsappNotification(null), 7000);
    }, 2500);
  };

  const handleLogin = (role: UserRole) => {
    setCurrentUser({
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      name: role === UserRole.ADMIN ? 'System Administrator' : 'Dhanuprabu J',
      email: role.toLowerCase() + '@university.edu',
      role,
      department: 'Advanced Materials & Research'
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('inventory');
    setSelectedEqForDetails(null);
  };

  const categories = ['All', ...Array.from(new Set(equipment.map(e => e.category)))];

  const filteredEquipment = equipment.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openBookingForm = (eq: Equipment) => {
    setBookingTarget(eq);
    setIsBookingFormOpen(true);
    setFormData({
      facultyName: currentUser?.name || '',
      department: ENGINEERING_DEPARTMENTS[0],
      whatsappNumber: '',
      purpose: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
  };

  const downloadPDFReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('LabCentral Reservation Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const tableData = bookings.map(b => {
      const eq = equipment.find(e => e.id === b.equipmentId);
      const fine = calculateFine(b.endTime, b.status);
      return [
        b.id.slice(-6),
        eq?.name || 'Unknown',
        b.facultyName,
        b.department,
        `${new Date(b.startTime).toLocaleDateString()} - ${new Date(b.endTime).toLocaleDateString()}`,
        b.status,
        fine > 0 ? `$${fine}` : '$0'
      ];
    });

    (doc as any).autoTable({
      startY: 35,
      head: [['ID', 'Equipment', 'Researcher', 'Dept', 'Period', 'Status', 'Fine']],
      body: tableData,
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`LabCentral_Report_${new Date().getTime()}.pdf`);
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTarget || !currentUser) return;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      alert("Error: Equipment usage is strictly limited to a maximum of 7 days per booking.");
      return;
    }

    if (end < start) {
      alert("Error: End date cannot be before start date.");
      return;
    }

    const newBooking: Booking = {
      id: 'bk-' + Math.random().toString(36).substr(2, 9),
      equipmentId: bookingTarget.id,
      userId: currentUser.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      purpose: formData.purpose,
      facultyName: formData.facultyName,
      department: formData.department,
      whatsappNumber: formData.whatsappNumber,
      status: BookingStatus.PENDING,
      requestedAt: new Date().toISOString()
    };

    setBookings(prev => [...prev, newBooking]);
    setIsBookingFormOpen(false);
    
    // Add to WA log as queued
    const logId = 'wa-' + Math.random().toString(36).substr(2, 9);
    setWhatsappLogs(prev => [{
      id: logId,
      to: formData.whatsappNumber,
      message: `System: Request for ${bookingTarget.name} received. Waiting for admin approval.`,
      timestamp: new Date().toISOString(),
      status: 'QUEUED'
    }, ...prev]);

    alert('Booking submitted. Automatic WhatsApp alerts are active.');
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings(prev => {
      const target = prev.find(b => b.id === bookingId);
      if (target && status === BookingStatus.APPROVED) {
        const eq = equipment.find(e => e.id === target.equipmentId);
        const msg = `LabCentral Alert: Hi ${target.facultyName}, your request for ${eq?.name} from ${new Date(target.startTime).toLocaleDateString()} to ${new Date(target.endTime).toLocaleDateString()} has been APPROVED. Use ID: ${target.id.slice(-6)}.`;
        triggerWhatsAppAlert(target.whatsappNumber, msg);
      }
      return prev.map(b => b.id === bookingId ? { ...b, status } : b);
    });
  };

  const askAiAssistant = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    const result = await getLabAssistantInsights(aiPrompt, equipment);
    setAiResponse(result || 'No response from AI.');
    setIsAiLoading(false);
  };

  const utilizationChartData = useMemo(() => {
    return equipment.map(e => ({
      name: e.name.split(' ')[0],
      usage: e.totalUsageHours,
      avg: 2000
    }));
  }, [equipment]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-6 relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600 opacity-10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600 opacity-10 rounded-full blur-[100px]"></div>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 space-y-10 relative z-10 border border-gray-100">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-2xl mb-6 shadow-lg">
              <Icons.Lab />
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">LabCentral</h2>
            <p className="mt-2 text-base text-gray-500 font-medium tracking-tight">University Research Facility Portal</p>
          </div>
          <div className="space-y-4">
            <button onClick={() => handleLogin(UserRole.FACULTY)} className="w-full flex items-center justify-between px-8 py-5 border border-transparent text-lg font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md">
              <span>Researcher Access</span>
              <Icons.User />
            </button>
            <button onClick={() => handleLogin(UserRole.ADMIN)} className="w-full flex items-center justify-between px-8 py-5 border-2 border-gray-200 text-lg font-bold rounded-2xl text-gray-700 bg-white hover:bg-gray-50 transition-all">
              <span>Admin Dashboard</span>
              <Icons.Stats />
            </button>
          </div>
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Transformation in Research</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex border-r border-slate-800">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-xl text-white shadow-lg">
            <Icons.Lab />
          </div>
          <span className="text-2xl font-black tracking-tighter">LabCentral</span>
        </div>
        <nav className="flex-1 mt-2 px-4 space-y-1">
          {[
            { id: 'inventory', icon: Icons.Search, label: 'Inventory' },
            { id: 'bookings', icon: Icons.Calendar, label: 'Reservations' },
            { id: 'assistant', icon: Icons.Lab, label: 'AI Assistant', pulse: true },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon />
              <span className="font-semibold">{item.label}</span>
              {item.pulse && <div className="ml-auto w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>}
            </button>
          ))}
          {currentUser.role === UserRole.ADMIN && (
            <div className="mt-8 pt-8 border-t border-slate-800 space-y-1">
              <p className="px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Management</p>
              <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <Icons.Check />
                <span className="font-semibold">Approvals</span>
                {bookings.filter(b => b.status === BookingStatus.PENDING).length > 0 && (
                  <span className="ml-auto bg-orange-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {bookings.filter(b => b.status === BookingStatus.PENDING).length}
                  </span>
                )}
              </button>
              <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <Icons.Stats />
                <span className="font-semibold">Analytics</span>
              </button>
            </div>
          )}
        </nav>
        <div className="p-6">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center font-bold text-white shadow-inner">
                {currentUser.name[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{currentUser.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full py-2.5 text-xs font-bold text-slate-300 bg-slate-800 hover:text-red-400 transition-all rounded-xl border border-slate-700">
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        {/* Real-time WhatsApp Notification Overlay */}
        {whatsappNotification && (
          <div className={`fixed top-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-300`}>
            <div className={`${whatsappNotification.status === 'sending' ? 'bg-slate-800 border-slate-700' : 'bg-green-600 border-green-500'} text-white p-5 rounded-2xl shadow-2xl flex items-start gap-4 max-w-sm border-2 transition-all duration-500`}>
              <div className="bg-white/20 p-2 rounded-full shrink-0">
                 {whatsappNotification.status === 'sending' ? (
                   <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                 ) : (
                   <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.631.058-1.736-.391-1.391-.567-2.302-1.994-2.373-2.087-.07-.092-.582-.771-.582-1.478 0-.708.372-1.054.502-1.197.13-.144.288-.18.384-.18s.192.001.276.005c.097.004.228-.037.357.274.129.312.441 1.074.48 1.153.038.079.064.171.012.274-.051.103-.077.171-.154.26-.077.089-.163.199-.232.268-.083.08-.17.167-.073.333.097.167.432.714.927 1.153.638.567 1.173.743 1.34.825.167.082.263.068.361-.041.096-.109.412-.48.521-.644.11-.164.22-.137.37-.082.15.055.952.45 1.114.531.162.082.27.123.308.191.039.069.039.398-.105.803z" /></svg>
                 )}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">
                  {whatsappNotification.status === 'sending' ? 'Sending Automated Notification...' : 'WhatsApp Alert Sent to ' + whatsappNotification.to}
                </p>
                <p className="text-sm font-medium leading-snug mb-3">{whatsappNotification.message}</p>
                <a 
                  href={whatsappNotification.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-50 transition-colors"
                >
                  Open WhatsApp Web
                </a>
              </div>
              <button onClick={() => setWhatsappNotification(null)} className="text-white/60 hover:text-white"><Icons.Close /></button>
            </div>
          </div>
        )}

        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tight">{activeTab.replace('_', ' ')}</h1>
              <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest leading-none">Real-time Connected</span>
              </div>
            </div>
            <p className="text-slate-500 font-medium tracking-tight">Managing {equipment.length} Lab Assets • User: {currentUser.name}</p>
          </div>
          
          {activeTab === 'inventory' && (
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Icons.Search />
                </div>
                <input
                  type="text"
                  placeholder="Filter research tools..."
                  className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none w-full md:w-80 shadow-sm transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-700 shadow-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          )}

          {activeTab === 'bookings' && (
            <button 
              onClick={downloadPDFReport}
              className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
            >
              <Icons.Check /> Export PDF Report
            </button>
          )}
        </header>

        <section>
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredEquipment.map(item => {
                const activeBooking = bookings.find(b => 
                  b.equipmentId === item.id && 
                  b.status === BookingStatus.APPROVED &&
                  new Date(b.startTime) <= new Date() &&
                  new Date(b.endTime) >= new Date()
                );

                return (
                  <div key={item.id} className="group bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300 flex flex-col">
                    <div className="relative h-44 overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute top-4 left-4"><Badge status={item.status} /></div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{item.name}</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">{item.labName}</p>
                      
                      {item.status === EquipmentStatus.IN_USE && activeBooking && (
                        <div className="mb-4 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                          <div className="flex items-center gap-2 mb-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                             <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Active User</p>
                          </div>
                          <p className="text-xs font-bold text-slate-800">{activeBooking.facultyName}</p>
                          <p className="text-[10px] text-slate-500 font-medium mb-2">{activeBooking.department}</p>
                          <p className="text-[9px] font-bold text-indigo-600 bg-white px-2 py-1 rounded border border-indigo-50 inline-block uppercase">
                             Until {new Date(activeBooking.endTime).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 mb-4 mt-auto">
                        <button onClick={() => setSelectedEqForDetails(item)} className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 flex items-center justify-center gap-2">
                          <Icons.Info /> Specs
                        </button>
                      </div>
                      <button 
                        onClick={() => openBookingForm(item)}
                        disabled={item.status !== EquipmentStatus.AVAILABLE}
                        className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all ${item.status === EquipmentStatus.AVAILABLE ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                      >
                        {item.status === EquipmentStatus.AVAILABLE ? 'Schedule Session' : 'Currently in Use'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Equipment</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Period</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Researcher</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fine Amount</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">WhatsApp Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {bookings.map(booking => {
                      const eq = equipment.find(e => e.id === booking.equipmentId);
                      const fine = calculateFine(booking.endTime, booking.status);
                      const isOverdue = fine > 0;
                      return (
                        <tr key={booking.id} className={`hover:bg-slate-50/50 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                          <td className="px-8 py-6">
                            <div className="text-sm font-bold text-slate-900">{eq?.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID: {booking.id.slice(-6)}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                              {new Date(booking.startTime).toLocaleDateString()} - {new Date(booking.endTime).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-xs font-bold text-slate-800">{booking.facultyName}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{booking.department}</div>
                          </td>
                          <td className="px-8 py-6">
                            <Badge status={booking.status} isOverdue={isOverdue} />
                          </td>
                          <td className="px-8 py-6">
                            {fine > 0 ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-red-600">${fine}.00</span>
                                <span className="text-[9px] font-bold text-red-400 uppercase tracking-tighter">Penalty Charge</span>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-slate-400">No Fines</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              {booking.whatsappNumber}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Approval Queue */}
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">System Approval Queue</h3>
                <div className="space-y-4">
                  {bookings.filter(b => b.status === BookingStatus.PENDING).map(booking => {
                    const eq = equipment.find(e => e.id === booking.equipmentId);
                    return (
                      <div key={booking.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-100 hover:bg-white transition-all">
                        <div className="flex gap-6">
                          <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-200 shrink-0"><img src={eq?.image} className="h-full w-full object-cover" /></div>
                          <div>
                            <p className="text-lg font-black text-slate-900 leading-tight">{eq?.name}</p>
                            <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-wider">{booking.facultyName} • {booking.department}</p>
                            <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">Period: {new Date(booking.startTime).toLocaleDateString()} to {new Date(booking.endTime).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateBookingStatus(booking.id, BookingStatus.APPROVED)} className="px-6 py-3 bg-green-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-100">Approve</button>
                          <button onClick={() => updateBookingStatus(booking.id, BookingStatus.REJECTED)} className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50">Reject</button>
                        </div>
                      </div>
                    );
                  })}
                  {bookings.filter(b => b.status === BookingStatus.PENDING).length === 0 && (
                    <div className="text-center py-20 text-slate-300 font-bold">Queue is empty.</div>
                  )}
                </div>
              </div>

              {/* Real-time WhatsApp Log */}
              <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 text-white h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                   <h4 className="text-sm font-black uppercase tracking-[0.2em] text-green-500">WhatsApp Gateway</h4>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-bold uppercase">Online</span>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 font-mono text-[11px]">
                   {whatsappLogs.length > 0 ? whatsappLogs.map(log => (
                     <div key={log.id} className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                        <div className="flex justify-between">
                           <span className="text-indigo-400">TO: {log.to}</span>
                           <span className={log.status === 'DELIVERED' ? 'text-green-400' : 'text-yellow-400'}>{log.status}</span>
                        </div>
                        <p className="text-white/60 line-clamp-2">{log.message}</p>
                        <p className="text-white/20 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</p>
                     </div>
                   )) : (
                     <div className="h-full flex items-center justify-center text-white/20">Waiting for events...</div>
                   )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-10">
                  <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Usage Metrics</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={utilizationChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} />
                        <Tooltip />
                        <Bar dataKey="usage" name="Hours Logged" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-10">
                  <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Request Velocity</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ name: 'Mon', r: 12 }, { name: 'Tue', r: 18 }, { name: 'Wed', r: 34 }, { name: 'Thu', r: 28 }, { name: 'Fri', r: 45 }, { name: 'Sat', r: 15 }, { name: 'Sun', r: 8 }]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="r" name="Requests" stroke="#6366f1" strokeWidth={4} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
            </div>
          )}

          {activeTab === 'assistant' && (
             <div className="max-w-4xl mx-auto py-4">
                <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 p-10 text-white">
                    <h3 className="text-3xl font-black mb-2 tracking-tight">AI Lab Strategist</h3>
                    <p className="text-slate-400 font-medium">Equipped for Authorized Researcher: {currentUser.name}</p>
                  </div>
                  <div className="p-10">
                    <div className="min-h-[350px] mb-8 p-8 bg-slate-50 rounded-[32px] border border-slate-100 overflow-y-auto font-medium text-slate-700 leading-relaxed">
                      {aiResponse || <div className="text-center text-slate-400 py-10 italic">Ask me about equipment efficiency or research workflows...</div>}
                    </div>
                    <div className="relative">
                      <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Type research inquiry..." className="w-full p-6 pr-20 bg-white border-2 border-slate-100 rounded-[32px] min-h-[140px] font-medium" />
                      <button onClick={askAiAssistant} className="absolute bottom-6 right-6 bg-indigo-600 text-white p-5 rounded-3xl hover:bg-indigo-700">
                        {isAiLoading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <Icons.Check />}
                      </button>
                    </div>
                  </div>
                </div>
             </div>
          )}
        </section>
      </main>

      {/* Detail Modal */}
      {selectedEqForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/20">
            <div className="md:w-2/5 relative h-64 md:h-auto"><img src={selectedEqForDetails.image} className="h-full w-full object-cover" /></div>
            <div className="md:w-3/5 p-10 overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Asset ID: {selectedEqForDetails.id}</p>
                  <h2 className="text-3xl font-black text-slate-900 mt-2">{selectedEqForDetails.name}</h2>
                </div>
                <button onClick={() => setSelectedEqForDetails(null)}><Icons.Close /></button>
              </div>
              <div className="space-y-6">
                <p className="text-slate-700 font-medium leading-relaxed">{selectedEqForDetails.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedEqForDetails.specifications.map((s, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-600 border border-slate-100">{s}</div>
                  ))}
                </div>
                <div className="p-6 bg-indigo-50 rounded-3xl flex items-center justify-between border border-indigo-100">
                   <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Policy</p>
                    <p className="text-sm font-bold text-indigo-900">7-Day Usage Limit</p>
                   </div>
                   <button onClick={() => { setSelectedEqForDetails(null); openBookingForm(selectedEqForDetails); }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Reserve Unit</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {isBookingFormOpen && bookingTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Facility Reservation</h2>
                <p className="text-indigo-200 text-sm font-medium">Target: {bookingTarget.name}</p>
              </div>
              <button onClick={() => setIsBookingFormOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><Icons.Close /></button>
            </div>
            <form onSubmit={submitBooking} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Faculty Name</label>
                  <input type="text" required value={formData.facultyName} onChange={e => setFormData({...formData, facultyName: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">WhatsApp Contact</label>
                  <input type="tel" required placeholder="+1234567890" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Department</label>
                <select 
                  required 
                  value={formData.department} 
                  onChange={e => setFormData({...formData, department: e.target.value})} 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm"
                >
                  {ENGINEERING_DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Experimental Scope</label>
                <textarea required value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm h-24" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">End Date (Strict 7D Max)</label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Queue Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
