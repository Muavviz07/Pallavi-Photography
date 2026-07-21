"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { 
  Loader2, Check, X, Calendar, User, Mail, ShieldAlert, 
  Filter, Clock, Trash, Search, ChevronLeft, ChevronRight, Lock, Unlock, CalendarDays, BarChart2
} from "lucide-react";
import { formatDate } from "@/lib/date";

interface BookingResponse {
  id: string;
  name: string;
  email: string;
  date: string;
  time: string;
  message?: string;
  status: string;
  session_type?: string;
  created_at: string;
}

interface BusyTimeResponse {
  id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  is_full_day: boolean;
  reason?: string;
  created_at: string;
}

export default function AdminBookings() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  // Active view tab state
  const [activeTab, setActiveTab] = useState<"reservations" | "locks">("reservations");

  // Bookings list state
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters state
  const [period, setPeriod] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Client Details search (Name or Email)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Busy Time Override states
  const [busyTimes, setBusyTimes] = useState<BusyTimeResponse[]>([]);
  const [loadingBusy, setLoadingBusy] = useState(false);
  const [submittingBusy, setSubmittingBusy] = useState(false);
  const [busyForm, setBusyForm] = useState({
    date: "",
    is_full_day: true,
    start_time: "09:00",
    end_time: "11:00",
    reason: ""
  });

  // Admin Monthly Calendar view state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarSummary, setCalendarSummary] = useState<Record<string, { booked: number; total: number }>>({});

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();

  const loadBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (period) params.append("period", period);
      if (statusFilter) params.append("status", statusFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const data = await fetchAPI(`/api/bookings/admin/all${queryString}`, { token });
      
      if (data && data.bookings) {
        setBookings(data.bookings);
      } else if (Array.isArray(data)) {
        setBookings(data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("Failed to load bookings list in admin panel", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBusyTimes = async () => {
    if (!token) return;
    setLoadingBusy(true);
    try {
      const data = await fetchAPI("/api/bookings/admin/busy-time", { token });
      setBusyTimes(data || []);
    } catch (err) {
      console.error("Failed to load busy time blocks", err);
    } finally {
      setLoadingBusy(false);
    }
  };

  // Fetch monthly calendar summaries for date block selections
  const loadCalendarSummary = async () => {
    if (!token) return;
    try {
      const start = new Date(calYear, calMonth, 1);
      const end = new Date(calYear, calMonth + 1, 0);
      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
      
      const data = await fetchAPI(
        `/api/bookings/calendar-summary/?start_date=${startStr}&end_date=${endStr}`,
        { token }
      );
      setCalendarSummary(data || {});
    } catch (err) {
      console.error("Failed to fetch calendar summary", err);
    }
  };

  useEffect(() => {
    if (token) {
      loadBookings();
      loadBusyTimes();
    }
  }, [token, period, statusFilter, startDate, endDate]);

  useEffect(() => {
    if (token) {
      loadCalendarSummary();
    }
  }, [token, calYear, calMonth, busyTimes, bookings]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (updatingId) return;
    if (!confirm(`Are you sure you want to change booking request status to ${newStatus.toUpperCase()}?`)) return;

    setUpdatingId(id);
    try {
      await fetchAPI(`/api/bookings/admin/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: newStatus }),
      });
      loadBookings();
    } catch (err) {
      console.error("Failed to update booking status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking request?")) return;
    try {
      await fetchAPI(`/api/bookings/admin/${id}`, {
        method: "DELETE",
        token,
      });
      loadBookings();
    } catch (err) {
      console.error("Failed to delete booking", err);
    }
  };

  const handleCreateBusyTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busyForm.date) return;

    setSubmittingBusy(true);
    try {
      const payload: any = {
        date: busyForm.date,
        is_full_day: busyForm.is_full_day,
        reason: busyForm.reason || null
      };

      if (!busyForm.is_full_day) {
        payload.start_time = busyForm.start_time.includes(":") && busyForm.start_time.split(":").length === 2 
          ? `${busyForm.start_time}:00` 
          : busyForm.start_time;
        payload.end_time = busyForm.end_time.includes(":") && busyForm.end_time.split(":").length === 2 
          ? `${busyForm.end_time}:00` 
          : busyForm.end_time;
      }

      await fetchAPI("/api/bookings/admin/busy-time", {
        method: "POST",
        token,
        body: JSON.stringify(payload)
      });

      setBusyForm({
        date: "",
        is_full_day: true,
        start_time: "09:00",
        end_time: "11:00",
        reason: ""
      });
      loadBusyTimes();
      loadBookings();
    } catch (err) {
      console.error("Failed to create busy time block", err);
    } finally {
      setSubmittingBusy(false);
    }
  };

  const handleDeleteBusyTime = async (id: string) => {
    if (!confirm("Delete this busy timeframe block?")) return;
    try {
      await fetchAPI(`/api/bookings/admin/busy-time/${id}`, {
        method: "DELETE",
        token
      });
      loadBusyTimes();
      loadBookings();
    } catch (err) {
      console.error("Failed to delete busy time block", err);
    }
  };

  // Calendar calculation methods
  const handlePrevMonth = () => {
    setCalendarDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calYear, calMonth + 1, 1));
  };

  const handleCalendarDayClick = (day: number) => {
    const selected = new Date(calYear, calMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) return; // Prevent selections of past dates

    const isoStr = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`;
    setBusyForm(prev => ({ ...prev, date: isoStr }));
  };

  // Dynamic Client-side Search and Filter mapping
  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(query) || 
      b.email.toLowerCase().includes(query)
    );
  });

  // Calculate dynamic stats for Analytics Cards
  const totalCount = bookings.length;
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const approvedCount = bookings.filter(b => b.status === "approved").length;
  const blockedCount = busyTimes.length;

  if (loading && bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
        <p className="text-xs text-[#6E635F] font-light">Loading bookings...</p>
      </div>
    );
  }

  const role = (session?.user as any)?.role;
  if (session && role !== "admin" && role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-lg font-serif font-light text-brand-dark uppercase">Access Denied</h2>
        <p className="text-xs text-brand-muted max-w-sm text-center leading-relaxed">
          You do not have administrative privileges to manage booking requests. Please contact the administrator.
        </p>
      </div>
    );
  }

  // Monthly calendar build vars
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const calendarDaysGrid = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDaysGrid.push(<div key={`empty-cal-${i}`} className="p-3" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDateObj = new Date(calYear, calMonth, d);
    const dateStr = `${cellDateObj.getFullYear()}-${String(cellDateObj.getMonth() + 1).padStart(2, "0")}-${String(cellDateObj.getDate()).padStart(2, "0")}`;
    
    // Check if locked
    const dayLocks = busyTimes.filter(bt => bt.date === dateStr);
    const hasFullDayLock = dayLocks.some(bt => bt.is_full_day);
    const hasPartialLock = dayLocks.some(bt => !bt.is_full_day);
    
    // Check booking counts
    const daySummary = calendarSummary[dateStr];
    const bookedCount = daySummary ? daySummary.booked : 0;
    
    const isSelected = busyForm.date === dateStr;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = cellDateObj < today;

    let cellClass = "bg-white hover:bg-[#FAF8F5]/80 hover:border-[#C4A484]/40 text-[#6E635F] border-stone-100 shadow-2xs";
    if (hasFullDayLock) {
      cellClass = "bg-red-50/70 border-red-200 text-red-700 font-semibold";
    } else if (hasPartialLock) {
      cellClass = "bg-amber-50/60 border-amber-300/60 text-amber-800 font-medium";
    } else if (isSelected) {
      cellClass = "bg-[#2C2623] text-white font-medium border-[#2C2623] shadow-md";
    } else if (bookedCount > 0) {
      cellClass = "bg-stone-50/50 border-[#DCD0C0]/35 text-[#2C2623] font-medium";
    }

    calendarDaysGrid.push(
      <button
        key={`cal-day-${d}`}
        type="button"
        disabled={isPast}
        onClick={() => handleCalendarDayClick(d)}
        className={`p-3 text-center text-xs rounded-sm border transition-all relative flex flex-col items-center justify-between min-h-[46px] ${
          isPast 
            ? "text-stone-300 cursor-not-allowed bg-stone-50/10 line-through border-transparent" 
            : `cursor-pointer ${cellClass}`
        }`}
      >
        <span>{d}</span>
        <div className="flex space-x-0.5 items-center justify-center h-2 mt-0.5">
          {hasFullDayLock && <Lock className="w-2.5 h-2.5 text-red-500 shrink-0" />}
          {!hasFullDayLock && hasPartialLock && <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
          {!hasFullDayLock && bookedCount > 0 && (
            Array.from({ length: bookedCount }).map((_, idx) => (
              <span key={idx} className="w-1 h-1 bg-[#C4A484] rounded-full shrink-0" />
            ))
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#DCD0C0]/25 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-light font-serif text-[#2C2623]">
            Reservations Console
          </h1>
          <p className="text-xs text-[#6E635F] font-light mt-1">
            Review client session requests, lock administrative busy slots, and analyze booking timelines.
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex bg-[#FAF8F5] border border-[#DCD0C0]/30 rounded-xs p-1 gap-1 text-[11px] uppercase tracking-wider font-semibold">
          <button
            onClick={() => setActiveTab("reservations")}
            className={`px-4 py-2 rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "reservations" 
                ? "bg-white text-[#2C2623] shadow-xs" 
                : "text-stone-400 hover:text-[#2C2623]"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Reservations Log</span>
          </button>
          <button
            onClick={() => setActiveTab("locks")}
            className={`px-4 py-2 rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "locks" 
                ? "bg-white text-[#2C2623] shadow-xs" 
                : "text-stone-400 hover:text-[#2C2623]"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Timeframes</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: Reservations list log & statistics */}
      {activeTab === "reservations" ? (
        <div className="space-y-8 animate-fade-in w-full">
          
          {/* STATS ANALYTICS SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-5 flex items-center justify-between shadow-2xs hover:border-[#C4A484]/35 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Total Requests</span>
                <p className="text-2xl font-light font-mono text-[#2C2623]">{totalCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FAF8F5] flex items-center justify-center border border-stone-100">
                <BarChart2 className="w-5 h-5 text-[#C4A484]" />
              </div>
            </div>

            <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-5 flex items-center justify-between shadow-2xs hover:border-[#C4A484]/35 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Pending Approval</span>
                <p className="text-2xl font-light font-mono text-amber-600">{pendingCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50/40 flex items-center justify-center border border-amber-100/20">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-5 flex items-center justify-between shadow-2xs hover:border-[#C4A484]/35 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Approved Sessions</span>
                <p className="text-2xl font-light font-mono text-green-700">{approvedCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-50/30 flex items-center justify-center border border-green-100/20">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            </div>

            <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-5 flex items-center justify-between shadow-2xs hover:border-[#C4A484]/35 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Timeframe Locks</span>
                <p className="text-2xl font-light font-mono text-stone-600">{blockedCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center border border-stone-200/50">
                <Lock className="w-5 h-5 text-stone-500" />
              </div>
            </div>
          </div>

          {/* FULL WIDTH FILTERING CONSOLE */}
          <div className="bg-[#FAF8F5] border border-[#DCD0C0]/35 rounded-md p-5 space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-[#2C2623]">
              <Filter className="w-4 h-4 text-brand-sage" />
              <span>Search & Filter Reservations</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Dynamic Text Search */}
              <div className="md:col-span-4 relative">
                <label className="block text-[9px] uppercase text-[#6E635F] mb-1 font-semibold tracking-wider">Search Client</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-3.5 h-3.5 text-stone-300" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by client name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#DCD0C0]/40 rounded-xs pl-8 pr-3 py-1.5 text-xs outline-hidden focus:border-[#C4A484]"
                  />
                </div>
              </div>

              {/* Period Select */}
              <div className="md:col-span-3">
                <label className="block text-[9px] uppercase text-[#6E635F] mb-1 font-semibold tracking-wider">Time Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-white border border-[#DCD0C0]/40 rounded-xs px-3 py-1.5 text-xs outline-hidden focus:border-[#C4A484]"
                >
                  <option value="">All History</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Date range</option>
                </select>
              </div>

              {/* Status Select */}
              <div className="md:col-span-3">
                <label className="block text-[9px] uppercase text-[#6E635F] mb-1 font-semibold tracking-wider">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-[#DCD0C0]/40 rounded-xs px-3 py-1.5 text-xs outline-hidden focus:border-[#C4A484]"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending Requests</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={() => {
                    setPeriod("");
                    setStatusFilter("");
                    setSearchQuery("");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="w-full text-center border border-[#DCD0C0]/40 hover:bg-stone-50 text-[10px] uppercase font-semibold tracking-wider py-2 rounded-xs text-[#6E635F] transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Custom Range picker inputs */}
            {period === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#DCD0C0]/15 animate-fade-in">
                <div>
                  <label className="block text-[9px] uppercase text-[#6E635F] mb-1 font-semibold tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-[#DCD0C0]/40 rounded-xs px-3 py-1.5 text-xs outline-hidden focus:border-[#C4A484]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase text-[#6E635F] mb-1 font-semibold tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-[#DCD0C0]/40 rounded-xs px-3 py-1.5 text-xs outline-hidden focus:border-[#C4A484]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* FULL WIDTH RESERVATIONS TABLE */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white">
              <p className="text-xs text-[#6E635F] font-light">No reservations found matching the selected search query and filters.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#DCD0C0]/25 rounded-md overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs font-light text-[#6E635F] border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#DCD0C0]/20 text-[#2C2623] font-semibold uppercase tracking-wider text-[9px]">
                    <th className="p-4">Client Detail</th>
                    <th className="p-4">Session & Type</th>
                    <th className="p-4">Reserved Date & Time</th>
                    <th className="p-4">Message / Notes</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => {
                    const dateStr = formatDate(b.date);
                    const timeStr = b.time.slice(0, 5);
                    const isUpdating = updatingId === b.id;

                    return (
                      <tr key={b.id} className="border-b border-[#DCD0C0]/15 hover:bg-[#FAF8F5]/30 transition-colors">
                        <td className="p-4 space-y-0.5 w-72">
                          <p className="font-semibold text-[#2C2623]">{b.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-300" /> {b.email}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className="inline-block text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-brand-bg border border-brand-border text-brand-dark font-medium">
                            {b.session_type || "General Session"}
                          </span>
                        </td>
                        <td className="p-4 space-y-0.5">
                          <p className="text-[#2C2623] flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-[#C4A484] shrink-0" /> {dateStr}
                          </p>
                          <p className="text-[10px] text-stone-400 pl-5 font-mono">at {timeStr}</p>
                        </td>
                        <td className="p-4 max-w-sm text-[11px] font-light leading-relaxed text-[#6E635F]">
                          {b.message || <span className="text-stone-300 italic">No notes</span>}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[8px] font-semibold uppercase tracking-wider ${
                            b.status === "approved"
                              ? "bg-green-50 text-green-700"
                              : b.status === "declined"
                              ? "bg-red-50 text-red-700"
                              : b.status === "cancelled"
                              ? "bg-stone-50 text-stone-500"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin text-stone-400 ml-auto" />
                          ) : (
                            <div className="inline-flex space-x-2 items-center justify-end">
                              {b.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(b.id, "approved")}
                                    className="p-1.5 border border-green-200 rounded-sm text-green-600 hover:bg-green-50 transition-all cursor-pointer"
                                    title="Approve Reservation"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(b.id, "declined")}
                                    className="p-1.5 border border-red-200 rounded-sm text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                                    title="Decline Reservation"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDelete(b.id)}
                                className="p-1 px-2.5 border border-stone-200 rounded-sm text-[10px] text-stone-400 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer"
                                title="Delete Request"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* 3. TAB CONTENT: Lock timeframe blocks & monthly calendar */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in w-full">
          
          {/* Lock timeframe form */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#FAF8F5] border border-[#DCD0C0]/35 rounded-md p-6 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#2C2623] uppercase tracking-wider border-b border-[#DCD0C0]/25 pb-3">
                <Clock className="w-4 h-4 text-brand-sage" />
                <span>Configure Busy Lock</span>
              </div>

              <form onSubmit={handleCreateBusyTime} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase text-[#6E635F] mb-1 font-semibold">Select Lock Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toLocaleDateString('en-CA')}
                    value={busyForm.date}
                    onChange={(e) => setBusyForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-white border border-[#DCD0C0]/40 rounded-xs px-2.5 py-1.5 text-xs focus:border-[#C4A484] outline-hidden font-mono"
                  />
                  <p className="text-[10px] text-stone-400 mt-1 italic font-light">Tip: Or click a day on the calendar to prefill.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="busy-full-day"
                    checked={busyForm.is_full_day}
                    onChange={(e) => setBusyForm(prev => ({ ...prev, is_full_day: e.target.checked }))}
                    className="w-4 h-4 text-brand-sage focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="busy-full-day" className="select-none text-[#6E635F] cursor-pointer">Lock Entire Day</label>
                </div>

                {!busyForm.is_full_day && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <div>
                      <label className="block text-[10px] uppercase text-[#6E635F] mb-1 font-semibold">Start Time</label>
                      <select
                        value={busyForm.start_time}
                        onChange={(e) => setBusyForm(prev => ({ ...prev, start_time: e.target.value }))}
                        className="w-full bg-white border border-[#DCD0C0]/40 rounded-xs px-2 py-1.5 text-xs focus:border-[#C4A484] outline-hidden"
                      >
                        <option value="09:00">09:00</option>
                        <option value="11:00">11:00</option>
                        <option value="14:00">14:00</option>
                        <option value="16:00">16:00</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-[#6E635F] mb-1 font-semibold">End Time</label>
                      <select
                        value={busyForm.end_time}
                        onChange={(e) => setBusyForm(prev => ({ ...prev, end_time: e.target.value }))}
                        className="w-full bg-white border border-[#DCD0C0]/40 rounded-xs px-2 py-1.5 text-xs focus:border-[#C4A484] outline-hidden"
                      >
                        <option value="11:00">11:00</option>
                        <option value="13:00">13:00</option>
                        <option value="16:00">16:00</option>
                        <option value="18:00">18:00</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase text-[#6E635F] mb-1 font-semibold">Reason (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Travel, Personal Holiday"
                    value={busyForm.reason}
                    onChange={(e) => setBusyForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full bg-white border border-[#DCD0C0]/40 rounded-xs px-2.5 py-1.5 text-xs focus:border-[#C4A484] outline-hidden font-light"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingBusy}
                  className="w-full bg-[#2C2623] hover:bg-[#352F2C] text-white py-2 rounded-xs uppercase tracking-widest text-[10px] font-semibold transition-colors disabled:opacity-50"
                >
                  {submittingBusy ? "Applying..." : "Lock Timeframe"}
                </button>
              </form>
            </div>
          </div>

          {/* Timeframe list & calendar block */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Table of active locks */}
            <div className="bg-[#FAF8F5] border border-[#DCD0C0]/35 rounded-md p-6 shadow-2xs space-y-4">
              <div className="text-xs font-semibold text-[#2C2623] uppercase tracking-wider border-b border-[#DCD0C0]/25 pb-3">
                Locked Timeframe Exclusions
              </div>

              {loadingBusy && busyTimes.length === 0 ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-sage" />
                </div>
              ) : busyTimes.length === 0 ? (
                <p className="text-stone-400 italic text-[11px] text-center py-6 bg-white border border-stone-100 rounded-sm">No timeframe locks currently active.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[220px] overflow-y-auto pr-1">
                  {busyTimes.map((bt) => (
                    <div key={bt.id} className="bg-white border border-[#DCD0C0]/25 rounded-sm p-3.5 text-xs flex justify-between items-start gap-2 shadow-2xs hover:border-[#C4A484]/30 transition-colors">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#2C2623]">{formatDate(bt.date)}</p>
                        <p className="text-[10px] text-stone-400 flex items-center gap-1 font-mono">
                          {bt.is_full_day ? "Full Day Locked" : `${bt.start_time?.slice(0, 5)} - ${bt.end_time?.slice(0, 5)}`}
                        </p>
                        {bt.reason && (
                          <p className="text-[10px] text-stone-500 font-light italic">Reason: {bt.reason}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteBusyTime(bt.id)}
                        className="p-1 hover:text-red-650 transition-colors"
                        title="Remove Busy Block"
                      >
                        <Trash className="w-3.5 h-3.5 text-stone-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Month Calendar */}
            <div className="bg-[#FAF8F5] border border-[#DCD0C0]/35 rounded-md p-6 shadow-2xs space-y-6">
              
              <div className="flex items-center justify-between border-b border-[#DCD0C0]/25 pb-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-serif font-semibold text-[#2C2623] uppercase tracking-wider">
                    {monthNames[calMonth]} {calYear}
                  </h3>
                  <p className="text-[10px] text-[#6E635F] font-light">Review booked slots (dots) and active locked dates (shaded).</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrevMonth}
                    type="button"
                    className="p-1.5 rounded-sm border border-[#DCD0C0]/40 text-[#6E635F] hover:text-[#2C2623] hover:bg-white transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    type="button"
                    className="p-1.5 rounded-sm border border-[#DCD0C0]/40 text-[#6E635F] hover:text-[#2C2623] hover:bg-white transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid Header weekdays */}
              <div className="grid grid-cols-7 gap-2 text-center text-[9px] uppercase tracking-wider font-semibold text-stone-400">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Grid Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDaysGrid}
              </div>
            </div>

          </div>

        </div>
      )}
      
    </div>
  );
}
