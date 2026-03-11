import React, { useState } from 'react';
import { api } from '../api';
import { Payout } from '../types';

interface Props {
  onSuccess: (payout: Payout) => void;
}

export function PayoutForm({ onSuccess }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountNet, setAmountNet] = useState('');
  const [amountGross, setAmountGross] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('date_from', dateFrom);
      formData.append('date_to', dateTo);
      formData.append('amount_net', amountNet);
      formData.append('amount_gross', amountGross);
      if (file) {
        formData.append('document', file);
      }

      const newPayout = await api.createPayout(formData);
      onSuccess(newPayout);
      // Reset form
      setDateFrom('');
      setDateTo('');
      setAmountNet('');
      setAmountGross('');
      setFile(null);
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Dokument (Payslip)</label>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
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
