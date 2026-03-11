import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { WorkEvent, Payout, Settings } from './types';

const getUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Użytkownik nie jest zalogowany');
  return user.uid;
};

export const api = {
  async getWorkEvents(): Promise<WorkEvent[]> {
    const uid = getUserId();
    const q = query(
      collection(db, 'users', uid, 'work_events'),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkEvent));
  },

  async createWorkEvent(data: Partial<WorkEvent>): Promise<WorkEvent> {
    const uid = getUserId();
    const newEvent = {
      date: data.date!,
      start_time: data.start_time!,
      end_time: data.end_time!,
      break_minutes: data.break_minutes!,
      net_hours: data.net_hours!,
      payout_id: null,
      created_at: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'users', uid, 'work_events'), newEvent);
    return { id: docRef.id, ...newEvent } as WorkEvent;
  },

  async deleteWorkEvent(id: string): Promise<void> {
    const uid = getUserId();
    await deleteDoc(doc(db, 'users', uid, 'work_events', id));
  },

  async getPayouts(): Promise<Payout[]> {
    const uid = getUserId();
    const q = query(
      collection(db, 'users', uid, 'payouts'),
      orderBy('date_from', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payout));
  },

  async createPayout(data: Omit<Payout, 'id' | 'created_at'>, eventIds: string[]): Promise<Payout> {
    const uid = getUserId();
    const newPayout = {
      ...data,
      created_at: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, 'users', uid, 'payouts'), newPayout);
    const payoutId = docRef.id;

    for (const eventId of eventIds) {
      await updateDoc(doc(db, 'users', uid, 'work_events', eventId), {
        payout_id: payoutId
      });
    }

    return { id: payoutId, ...newPayout } as Payout;
  },

  async getSettings(): Promise<Settings | null> {
    const uid = getUserId();
    const docRef = doc(db, 'users', uid, 'settings', 'default');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Settings;
    }
    return null;
  },

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const uid = getUserId();
    const docRef = doc(db, 'users', uid, 'settings', 'default');
    
    const settingsData = {
      default_start_time: data.default_start_time || '08:00',
      default_end_time: data.default_end_time || '16:00',
      default_break_minutes: data.default_break_minutes || 0,
    };

    await setDoc(docRef, settingsData, { merge: true });
    return { id: 'default', ...settingsData } as Settings;
  },
};
