import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { CapturingSlot, Port } from '../../types';
import {
  Calendar,
  Clock,
  Plus,
  Users,
  MapPin,
  CheckCircle,
  Ban,
  RotateCw
} from 'lucide-react';

export const CapturingCalendarView: React.FC = () => {
  const { currentPortId, ports, hasRole } = useAuth();
  const [slots, setSlots] = useState<CapturingSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // New slot form state (ID Unit & Admin)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDate, setNewDate] = useState('2026-10-18');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newCapacity, setNewCapacity] = useState(25);
  const [newVenue, setNewVenue] = useState('NPA ID Unit Biometric Centre, LPC Gate 1, Apapa Quays');

  const loadSlots = async () => {
    try {
      setLoading(true);
      const res = await api.getCapturingSlots(currentPortId !== 'ALL' ? currentPortId : undefined);
      setSlots(res.slots || []);
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [currentPortId]);

  const isIdUnit = hasRole('OIC_ID_UNIT') || hasRole('SYSTEM_ADMIN');

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const portId = currentPortId !== 'ALL' ? currentPortId : ports[0].id;
      await api.createCapturingSlot({
        portId,
        slotDate: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        capacity: Number(newCapacity),
        locationVenue: newVenue,
        isBlocked: false
      });
      setShowAddModal(false);
      await loadSlots();
    } catch (err: any) {
      alert(err.message || 'Failed to create slot');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Biometric Capturing Appointments & Capacity Scheduler
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time quota management for NPA port biometric workstations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSlots}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {isIdUnit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#087443] hover:bg-[#065C35] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Publish Capturing Slot
            </button>
          )}
        </div>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {slots.map((slot) => {
          const isFull = slot.bookedCount >= slot.capacity;
          const port = ports.find(p => p.id === slot.portId);
          return (
            <div
              key={slot.id}
              className={`p-5 rounded-xl border transition-all ${
                slot.isBlocked
                  ? 'bg-slate-50 border-slate-300 opacity-60'
                  : isFull
                  ? 'bg-amber-50/40 border-amber-300'
                  : 'bg-white border-slate-200 hover:border-[#087443] shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-[#087443] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {slot.slotDate}
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {port?.code || 'PORT'}
                </span>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-mono text-slate-800 font-bold">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{slot.startTime} – {slot.endTime}</span>
                </div>

                <div className="flex items-start gap-2 text-slate-600 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{slot.locationVenue}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">CAPACITY QUOTA</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {slot.bookedCount} / {slot.capacity} Persons
                  </span>
                </div>

                {slot.isBlocked ? (
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Ban className="w-3.5 h-3.5" /> Blocked
                  </span>
                ) : isFull ? (
                  <span className="text-[11px] font-bold text-amber-700">
                    Slot Fully Booked
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-[#087443] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {slot.capacity - slot.bookedCount} Slots Open
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSlot}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-300 space-y-4"
          >
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2">
              Publish New Biometric Capturing Slot
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Capacity (Persons)</label>
              <input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(parseInt(e.target.value))}
                className="w-full text-xs px-3 py-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Venue Location</label>
              <input
                type="text"
                value={newVenue}
                onChange={(e) => setNewVenue(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#087443] hover:bg-[#065C35] text-white rounded"
              >
                Publish Slot
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
