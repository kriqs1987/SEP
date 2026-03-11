import React from 'react';
import { Payout } from '../types';
import { FileText, Download } from 'lucide-react';

interface Props {
  payouts: Payout[];
}

export function PayoutList({ payouts }: Props) {
  if (payouts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
        Brak zapisanych wypłat.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Okres</th>
              <th className="px-6 py-4">Kwota Netto</th>
              <th className="px-6 py-4">Kwota Brutto</th>
              <th className="px-6 py-4 text-right">Dokument</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {payout.date_from} do {payout.date_to}
                </td>
                <td className="px-6 py-4 text-emerald-600 font-medium">
                  {payout.amount_net.toFixed(2)} zł
                </td>
                <td className="px-6 py-4">
                  {payout.amount_gross.toFixed(2)} zł
                </td>
                <td className="px-6 py-4 text-right">
                  {payout.document_url ? (
                    <a
                      href={payout.document_url}
                      download={`rozliczenie_${payout.date_from}_${payout.date_to}`}
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Pobierz</span>
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Brak pliku</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
