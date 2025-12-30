import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { DailyBurn, BurnTransaction } from '@/types';
import { CONSTANTS } from './constants';

const DB_PATH = path.join(process.cwd(), 'data', 'burns.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema();
  }
  return db;
}

function initializeSchema(): void {
  const database = db!;

  database.exec(`
    CREATE TABLE IF NOT EXISTS daily_burns (
      date TEXT PRIMARY KEY,
      cumulative_uni REAL NOT NULL,
      daily_uni REAL NOT NULL,
      uni_price_usd REAL,
      daily_usd_value REAL,
      cumulative_usd_value REAL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS burn_transactions (
      tx_hash TEXT PRIMARY KEY,
      block_number INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      uni_amount REAL NOT NULL,
      uni_price_usd REAL,
      usd_value REAL,
      from_address TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_burn_transactions_timestamp
    ON burn_transactions(timestamp);

    CREATE INDEX IF NOT EXISTS idx_daily_burns_date
    ON daily_burns(date);
  `);
}

export function getDailyBurns(): DailyBurn[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM daily_burns
    WHERE date >= ?
    ORDER BY date ASC
  `);
  return stmt.all(CONSTANTS.START_DATE) as DailyBurn[];
}

export function getDailyBurnByDate(date: string): DailyBurn | undefined {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM daily_burns WHERE date = ?
  `);
  return stmt.get(date) as DailyBurn | undefined;
}

export function upsertDailyBurn(burn: DailyBurn): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO daily_burns (date, cumulative_uni, daily_uni, uni_price_usd, daily_usd_value, cumulative_usd_value, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      cumulative_uni = excluded.cumulative_uni,
      daily_uni = excluded.daily_uni,
      uni_price_usd = excluded.uni_price_usd,
      daily_usd_value = excluded.daily_usd_value,
      cumulative_usd_value = excluded.cumulative_usd_value,
      updated_at = excluded.updated_at
  `);
  stmt.run(
    burn.date,
    burn.cumulative_uni,
    burn.daily_uni,
    burn.uni_price_usd,
    burn.daily_usd_value,
    burn.cumulative_usd_value,
    burn.updated_at
  );
}

export function getBurnTransactions(): BurnTransaction[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM burn_transactions
    ORDER BY timestamp DESC
  `);
  return stmt.all() as BurnTransaction[];
}

export function getLatestBurnTransaction(): BurnTransaction | undefined {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM burn_transactions
    ORDER BY block_number DESC
    LIMIT 1
  `);
  return stmt.get() as BurnTransaction | undefined;
}

export function insertBurnTransaction(tx: BurnTransaction): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR IGNORE INTO burn_transactions
    (tx_hash, block_number, timestamp, uni_amount, uni_price_usd, usd_value, from_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    tx.tx_hash,
    tx.block_number,
    tx.timestamp,
    tx.uni_amount,
    tx.uni_price_usd,
    tx.usd_value,
    tx.from_address
  );
}

export function insertManyBurnTransactions(txs: BurnTransaction[]): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR IGNORE INTO burn_transactions
    (tx_hash, block_number, timestamp, uni_amount, uni_price_usd, usd_value, from_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = database.transaction((transactions: BurnTransaction[]) => {
    for (const tx of transactions) {
      stmt.run(
        tx.tx_hash,
        tx.block_number,
        tx.timestamp,
        tx.uni_amount,
        tx.uni_price_usd,
        tx.usd_value,
        tx.from_address
      );
    }
  });

  insertMany(txs);
}

export function getTotalBurned(): number {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT SUM(uni_amount) as total FROM burn_transactions
    WHERE timestamp >= ?
  `);
  const result = stmt.get(CONSTANTS.START_DATE) as { total: number | null };
  return result.total || 0;
}

export function getTodayBurns(): number {
  const database = getDb();
  const today = new Date().toISOString().split('T')[0];
  const stmt = database.prepare(`
    SELECT SUM(uni_amount) as total FROM burn_transactions
    WHERE date(timestamp) = ?
  `);
  const result = stmt.get(today) as { total: number | null };
  return result.total || 0;
}

export function getHistoricalUsdValue(): number {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT SUM(usd_value) as total FROM burn_transactions
    WHERE usd_value IS NOT NULL AND timestamp >= ?
  `);
  const result = stmt.get(CONSTANTS.START_DATE) as { total: number | null };
  return result.total || 0;
}

export function getLatestDailyBurn(): DailyBurn | undefined {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM daily_burns
    ORDER BY date DESC
    LIMIT 1
  `);
  return stmt.get() as DailyBurn | undefined;
}

export function clearAllData(): void {
  const database = getDb();
  database.exec(`
    DELETE FROM daily_burns;
    DELETE FROM burn_transactions;
  `);
}
