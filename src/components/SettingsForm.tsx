import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Settings } from '../types';
import { Settings as SettingsIcon, Save } from 'lucide-react';

interface Props {
  settings: Settings | null;
  onSettingsUpdate: (settings: Settings) => void;
}

export function SettingsForm({ settings, onSettingsUpdate }: Props) {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setStartTime(settings.default_start_time);
      setEndTime(settings.default_end_time);
      setBreakMinutes(settings.default_break_minutes);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const updated = await api.updateSettings({
        default_start_time: startTime,
        default_end_time: endTime,
        default_break_minutes: breakMinutes,
      });
      onSettingsUpdate(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
      <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
        <SettingsIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900">Ustawienia domyślne</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <p className="text-gray-600 text-sm">
          Skonfiguruj domyślne godziny pracy i przerwę. Będą one automatycznie uzupełniane przy dodawaniu nowego dnia pracy.
        </p>

        {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
        {success && <div className="text-emerald-600 text-sm bg-emerald-50 p-3 rounded-lg">Ustawienia zostały zapisane.</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domyślna godzina rozpoczęcia</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domyślna godzina zakończenia</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Domyślna przerwa (minuty)</label>
          <input
            type="number"
            min="0"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 max-w-[200px]"
            required
          />
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Zapisywanie...' : 'Zapisz ustawienia'}
          </button>
        </div>
      </form>
    </div>
  );
}
