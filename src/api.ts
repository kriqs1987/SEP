import { WorkEvent, Payout, Settings } from './types';

async function fetchJson<T>(url: string, options?: RequestInit, retries = 3): Promise<T> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    
    // If we receive the "Please wait" HTML page from the proxy, the server is restarting
    if (text.trim().toLowerCase().startsWith('<!doctype')) {
      if (retries > 0) {
        console.warn(`Received HTML from ${url}, retrying in 1s... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchJson<T>(url, options, retries - 1);
      }
      throw new Error('Server is currently restarting. Please try again in a moment.');
    }
    
    if (!res.ok) {
      console.error(`API Error (${url}):`, text);
      let errorMessage = `Błąd serwera (status ${res.status})`;
      try {
        const errJson = JSON.parse(text);
        if (errJson.error) {
          errorMessage = errJson.error;
        } else if (errJson.message) {
          errorMessage = errJson.message;
        }
      } catch (e) {
        if (text && !text.toLowerCase().startsWith('<!doctype')) {
          errorMessage = text.length > 100 ? text.substring(0, 100) + '...' : text;
        }
      }
      throw new Error(errorMessage);
    }
    
    return JSON.parse(text);
  } catch (error) {
    if (retries > 0 && error instanceof TypeError) {
      // Network error (connection refused), retry
      console.warn(`Network error for ${url}, retrying in 1s... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchJson<T>(url, options, retries - 1);
    }
    throw error;
  }
}

export const api = {
  async getWorkEvents(): Promise<WorkEvent[]> {
    return fetchJson<WorkEvent[]>('/api/work-events');
  },

  async createWorkEvent(data: Partial<WorkEvent>): Promise<WorkEvent> {
    return fetchJson<WorkEvent>('/api/work-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteWorkEvent(id: number): Promise<void> {
    await fetchJson<void>(`/api/work-events/${id}`, { method: 'DELETE' });
  },

  async getPayouts(): Promise<Payout[]> {
    return fetchJson<Payout[]>('/api/payouts');
  },

  async createPayout(formData: FormData): Promise<Payout> {
    return fetchJson<Payout>('/api/payouts', {
      method: 'POST',
      body: formData,
    });
  },

  async getSettings(): Promise<Settings> {
    return fetchJson<Settings>('/api/settings');
  },

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    return fetchJson<Settings>('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
};
