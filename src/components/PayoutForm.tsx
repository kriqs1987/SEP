import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Payout, WorkEvent } from '../types';

interface Props {
  onSuccess: (payout: Payout) => void;
}

export function PayoutForm({ onSuccess }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountNet, setAmountNet] = useState('');
  const [amountGross, setAmountGross] = useState('');
  const [documentBase64, setDocumentBase64] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unpaidEvents, setUnpaidEvents] = useState<WorkEvent[]>([]);

  useEffect(() => {
    loadUnpaidEvents();
  }, []);

  const loadUnpaidEvents = async () => {
    try {
      const events = await api.getWorkEvents();
      setUnpaidEvents(events.filter(e => !e.payout_id));
    } catch (err) {
      console.error('Failed to load unpaid events', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        setError('Plik jest za duży. Maksymalny rozmiar to 500KB.');
        e.target.value = '';
        setDocumentBase64(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentBase64(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    } else {
      setDocumentBase64(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Find events that fall within the selected date range
      const eventsInPeriod = unpaidEvents.filter(
        event => event.date >= dateFrom && event.date <= dateTo
      );

      if (eventsInPeriod.length === 0) {
        throw new Error('Brak nieopłaconych dni pracy w wybranym okresie.');
      }

      const eventIds = eventsInPeriod.map(e => e.id);

      const newPayout = await api.createPayout({
        date_from: dateFrom,
        date_to: dateTo,
        amount_net: parseFloat(amountNet),
        amount_gross: parseFloat(amountGross),
        document_url: documentBase64,
      }, eventIds);

      onSuccess(newPayout);
      
      // Reset form
      setDateFrom('');
      setDateTo('');
      setAmountNet('');
      setAmountGross('');
      setDocumentBase64(null);
      loadUnpaidEvents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Dodaj Wypłatę</h3>
      
      {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Od</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Do</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kwota Netto</label>
          <input
            type="number"
            step="0.01"
            value={amountNet}
            onChange={(e) => setAmountNet(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kwota Brutto</label>
          <input
            type="number"
            step="0.01"
            value={amountGross}
            onChange={(e) => setAmountGross(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dokument (max 500KB)</label>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 mt-4"
      >
        {loading ? 'Zapisywanie...' : 'Zapisz Wypłatę i Rozlicz Dni'}
      </button>
    </form>
  );
}
