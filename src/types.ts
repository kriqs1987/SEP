export interface WorkEvent {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  net_hours: number;
  payout_id: number | null;
  created_at: string;
}

export interface Payout {
  id: number;
  date_from: string;
  date_to: string;
  amount_net: number;
  amount_gross: number;
  document_url: string | null;
  created_at: string;
}

export interface Settings {
  id: number;
  default_start_time: string;
  default_end_time: string;
  default_break_minutes: number;
}
