import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from './db.js';

const router = express.Router();

// Setup file uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// --- Work Events ---

// Get all work events
router.get('/work-events', (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM work_events ORDER BY date DESC').all();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch work events' });
  }
});

// Create a work event
router.post('/work-events', (req, res) => {
  const { date, start_time, end_time, break_minutes } = req.body;

  if (!date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Calculate net hours
  const start = new Date(`1970-01-01T${start_time}:00Z`);
  let end = new Date(`1970-01-01T${end_time}:00Z`);
  
  if (end < start) {
    // Crosses midnight
    end = new Date(`1970-01-02T${end_time}:00Z`);
  }

  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  const netMinutes = diffMinutes - (break_minutes || 0);
  const netHours = netMinutes / 60;

  try {
    const stmt = db.prepare(`
      INSERT INTO work_events (date, start_time, end_time, break_minutes, net_hours)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(date, start_time, end_time, break_minutes || 0, netHours);
    
    const newEvent = db.prepare('SELECT * FROM work_events WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create work event' });
  }
});

// Delete a work event
router.delete('/work-events/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM work_events WHERE id = ?');
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Work event not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete work event' });
  }
});

// --- Payouts ---

// Get all payouts
router.get('/payouts', (req, res) => {
  try {
    const payouts = db.prepare('SELECT * FROM payouts ORDER BY date_from DESC').all();
    res.json(payouts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Create a payout and link work events
router.post('/payouts', upload.single('document'), (req, res) => {
  const { date_from, date_to, amount_net, amount_gross } = req.body;
  const document_url = req.file ? `/api/uploads/${req.file.filename}` : null;

  if (!date_from || !date_to || !amount_net || !amount_gross) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const insertPayout = db.transaction(() => {
    // 1. Insert payout
    const stmt = db.prepare(`
      INSERT INTO payouts (date_from, date_to, amount_net, amount_gross, document_url)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(date_from, date_to, amount_net, amount_gross, document_url);
    const payoutId = result.lastInsertRowid;

    // 2. Link work events
    const linkStmt = db.prepare(`
      UPDATE work_events
      SET payout_id = ?
      WHERE date >= ? AND date <= ? AND payout_id IS NULL
    `);
    linkStmt.run(payoutId, date_from, date_to);

    return payoutId;
  });

  try {
    const payoutId = insertPayout();
    const newPayout = db.prepare('SELECT * FROM payouts WHERE id = ?').get(payoutId);
    res.status(201).json(newPayout);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create payout' });
  }
});

// --- Settings ---

// Get settings
router.get('/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.put('/settings', (req, res) => {
  const { default_start_time, default_end_time, default_break_minutes } = req.body;
  
  if (!default_start_time || !default_end_time || default_break_minutes === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE settings 
      SET default_start_time = ?, default_end_time = ?, default_break_minutes = ?
      WHERE id = 1
    `);
    stmt.run(default_start_time, default_end_time, default_break_minutes);
    
    const updated = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Serve uploaded files
router.use('/uploads', express.static(UPLOADS_DIR));

export default router;
