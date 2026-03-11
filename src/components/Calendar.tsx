import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileText, Trash2 } from 'lucide-react';
import { WorkEvent, Payout } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Props {
  events: WorkEvent[];
  payouts: Payout[];
  onDateClick: (date: Date) => void;
  onDeleteEvent: (id: number) => void;
}

export function Calendar({ events, payouts, onDateClick, onDeleteEvent }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return events.find(e => e.date === dayStr);
  };

  const getPayoutForEvent = (eventId: number | null) => {
    if (!eventId) return null;
    return payouts.find(p => p.id === eventId) || null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xl font-semibold text-gray-900 capitalize">
          {format(currentDate, 'LLLL yyyy', { locale: pl })}
        </h2>
        <div className="flex space-x-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {/* Padding for first day of month */}
        {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[100px] border-b border-r border-gray-100 bg-gray-50/30" />
        ))}

        {days.map((day, dayIdx) => {
          const event = getEventForDay(day);
          const payout = getPayoutForEvent(event?.payout_id || null);
          const isPaid = !!payout;

          return (
            <div
              key={day.toString()}
              onClick={() => !event && onDateClick(day)}
              className={twMerge(
                clsx(
                  "min-h-[100px] p-2 border-b border-r border-gray-100 relative group transition-colors",
                  !isSameMonth(day, currentDate) && "bg-gray-50 text-gray-400",
                  !event && "hover:bg-indigo-50 cursor-pointer",
                  event && (isPaid ? "bg-emerald-50/30" : "bg-amber-50/30")
                )
              )}
            >
              <div className="flex justify-between items-start">
                <span className={clsx(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                  isToday(day) ? "bg-indigo-600 text-white" : "text-gray-700"
                )}>
                  {format(day, 'd')}
                </span>
                
                {event && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {event && (
                <div className="mt-2 text-xs">
                  <div className="font-medium text-gray-900">
                    {event.start_time} - {event.end_time}
                  </div>
                  <div className="text-gray-500 mt-0.5">
                    Netto: {event.net_hours.toFixed(2)}h
                  </div>
                  
                  <div className={clsx(
                    "mt-2 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide inline-flex items-center gap-1 cursor-pointer",
                    isPaid ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-amber-100 text-amber-700"
                  )}
                  onClick={(e) => {
                    if (isPaid) {
                      e.stopPropagation();
                      setSelectedPayout(payout);
                    }
                  }}>
                    {isPaid ? 'Opłacony' : 'Nieopłacony'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payout Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPayout(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Szczegóły Wypłaty</h3>
              <button onClick={() => setSelectedPayout(null)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Okres</span>
                <span className="font-medium">{selectedPayout.date_from} do {selectedPayout.date_to}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Kwota Netto</span>
                <span className="font-medium text-emerald-600">{selectedPayout.amount_net.toFixed(2)} PLN</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Kwota Brutto</span>
                <span className="font-medium">{selectedPayout.amount_gross.toFixed(2)} PLN</span>
              </div>
              
              {selectedPayout.document_url && (
                <div className="pt-4">
                  <a 
                    href={selectedPayout.document_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium transition-colors border border-gray-200"
                  >
                    <FileText className="w-5 h-5" />
                    Zobacz Dokument (Payslip)
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
