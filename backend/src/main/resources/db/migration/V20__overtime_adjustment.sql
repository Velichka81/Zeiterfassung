-- Track overtime adjustments (payouts and compensatory time)
CREATE TABLE IF NOT EXISTS overtime_adjustment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT, -- ISO yyyy-MM-dd
  minutes INTEGER NOT NULL, -- positive minutes to subtract from overtime balance
  type TEXT NOT NULL, -- 'payout' | 'comp_time'
  note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES app_user(id)
);

-- Basic index for queries by user/date
CREATE INDEX IF NOT EXISTS idx_overtime_user_date ON overtime_adjustment(user_id, date);
