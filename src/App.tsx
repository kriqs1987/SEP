/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Calendar } from './components/Calendar';
import { WorkEventForm } from './components/WorkEventForm';
import { PayoutForm } from './components/PayoutForm';
import { PayoutList } from './components/PayoutList';
import { SettingsForm } from './components/SettingsForm';
import { api } from './api';
import { WorkEvent, Payout, Settings } from './types';
import { Briefcase, FileCheck, Calendar as CalendarIcon, Wallet, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [events, setEvents] = useState<WorkEvent[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'payouts' | 'settings'>('calendar');

  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoadingAuth(false);
      if (user) {
        loadData();
      }
    });
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const [eventsData, payoutsData, settingsData] = await Promise.all([
        api.getWorkEvents(),
        api.getPayouts(),
        api.getSettings(),
      ]);
      setEvents(eventsData);
      setPayouts(payoutsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load data', error);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setEvents([]);
      setPayouts([]);
      setSettings(null);
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Ładowanie...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-sm mx-auto mb-6">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">System Ewidencji Pracy</h1>
          <p className="text-gray-500 mb-8">Zaloguj się, aby zarządzać swoim czasem pracy i wypłatami.</p>
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Zaloguj się przez Google
          </button>
        </div>
      </div>
    );
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventSuccess = (newEvent: WorkEvent) => {
    setEvents([newEvent, ...events]);
    setSelectedDate(null);
  };

  const handlePayoutSuccess = (newPayout: Payout) => {
    setPayouts([newPayout, ...payouts]);
    loadData(); // Reload to get updated event links
    setActiveTab('payouts');
  };

  const handleDeleteEvent = async () => {
    if (eventToDelete === null) return;
    try {
      await api.deleteWorkEvent(eventToDelete);
      setEvents(events.filter(e => e.id !== eventToDelete));
      setEventToDelete(null);
    } catch (error) {
      console.error('Failed to delete event', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">
              System Ewidencji Pracy
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
            <div className="hidden sm:flex items-center gap-4 mr-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200"></div>
                Nieopłacone
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200"></div>
                Opłacone
              </div>
            </div>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <img src={user.photoURL || ''} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200" />
              <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600" title="Wyloguj">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl w-full max-w-2xl mb-8">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'calendar'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Kalendarz
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'payouts'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Wypłaty
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'settings'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            Ustawienia
          </button>
        </div>

        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Calendar */}
            <div className="lg:col-span-2 space-y-6">
              <Calendar 
                events={events} 
                payouts={payouts} 
                onDateClick={handleDateClick}
                onDeleteEvent={setEventToDelete}
              />
            </div>

            {/* Right Column: Forms & Actions */}
            <div className="space-y-6">
              {selectedDate && (
                <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                  <div className="p-4 flex justify-between items-center border-b border-gray-50">
                    <h3 className="font-semibold text-gray-900">Nowy Wpis</h3>
                    <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600">
                      &times;
                    </button>
                  </div>
                  <WorkEventForm onSuccess={handleEventSuccess} selectedDate={selectedDate} settings={settings} />
                </div>
              )}

              {/* Summary Widget */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Podsumowanie
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Dni nieopłacone</span>
                    <span className="font-bold text-amber-600 text-xl">
                      {events.filter(e => !e.payout_id).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Godziny nieopłacone</span>
                    <span className="font-bold text-amber-600 text-xl">
                      {events.filter(e => !e.payout_id).reduce((acc, e) => acc + e.net_hours, 0).toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Payouts List */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Historia Wypłat</h2>
              <PayoutList payouts={payouts} />
            </div>

            {/* Right Column: Add Payout Form */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="p-4 flex items-center gap-3 border-b border-gray-50 bg-emerald-50/30">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900">Rozlicz Okres</h3>
                </div>
                <PayoutForm onSuccess={handlePayoutSuccess} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex justify-center">
            <SettingsForm settings={settings} onSettingsUpdate={setSettings} />
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {eventToDelete !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEventToDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Usuń dzień pracy</h3>
            <p className="text-gray-600 mb-6">Czy na pewno chcesz usunąć ten dzień pracy? Tej operacji nie można cofnąć.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Anuluj
              </button>
              <button 
                onClick={handleDeleteEvent}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

