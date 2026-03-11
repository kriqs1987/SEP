import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { api } from '../api';
import { WorkEvent, Settings } from '../types';

interface Props {
  onSuccess: (event: WorkEvent) => void;
  selectedDate: Date;
  settings: Settings | null;
}

export function WorkEventForm({ onSuccess, selectedDate, settings }: Props) {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update defaults when settings or selectedDate changes
  useEffect(() => {
    if (settings) {
      setStartTime(settings.default_start_time);
      setEndTime(settings.default_end_time);
      setBreakMinutes(settings.default_break_minutes);
    }
  }, [settings, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const newEvent = await api.createWorkEvent({
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        break_minutes: breakMinutes,
      });
      onSuccess(newEvent);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-medium text-gray-900">Dodaj Dzień Pracy</h3>
      <p className="text-sm text-gray-500">Data: {selectedDate.toLocaleDateString()}</p>
      
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Od</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Do</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Przerwa (minuty)</label>
        <input
          type="number"
          min="0"
          value={breakMinutes}
          onChange={(e) => setBreakMinutes(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Zapisywanie...' : 'Zapisz'}
      </button>
    </form>
  );
}
