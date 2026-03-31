import { createClient } from '@libsql/client';
import type { DailyBurn, BurnTransaction } from '@/types';
import { CONSTANTS } from './constants';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url: url || 'file:local.db',
  authToken: authToken,
});

// --- Daily Burns ---

export async function getDailyBurns(chain?: string): Promise<DailyBurn[]> {
  if (chain) {
    const result = await db.execute({
      sql: `SELECT * FROM daily_burns WHERE date >= ? AND chain = ? ORDER BY date ASC`,
      args: [CONSTANTS.START_DATE, chain],
    });
    return result.rows as unknown as DailyBurn[];
  }
  const result = await db.execute({
    sql: `SELECT * FROM daily_burns WHERE date >= ? ORDER BY date ASC`,
    args: [CONSTANTS.START_DATE],
  });
  return result.rows as unknown as DailyBurn[];
}

export async function getDailyBurnsAggregated(): Promise<DailyBurn[]> {
  const result = await db.execute({
    sql: `
      SELECT
        date,
        'all' as chain,
        SUM(daily_uni) as daily_uni,
        SUM(daily_usd_value) as daily_usd_value,
        MAX(uni_price_usd) as uni_price_usd,
        MAX(updated_at) as updated_at,
        0 as cumulative_uni,
        0 as cumulative_usd_value
      FROM daily_burns
      WHERE date >= ?
      GROUP BY date
      ORDER BY date ASC
    `,
    args: [CONSTANTS.START_DATE],
  });

  // Recalculate cumulative values across the aggregated rows
  const rows = result.rows as unknown as DailyBurn[];
  let cumulativeUni = 0;
  let cumulativeUsd = 0;
  for (const row of rows) {
    cumulativeUni += row.daily_uni;
    cumulativeUsd += row.daily_usd_value || 0;
    row.cumulative_uni = cumulativeUni;
    row.cumulative_usd_value = cumulativeUsd;
  }
  return rows;
}

export async function getDailyBurnByDate(date: string, chain: string): Promise<DailyBurn | undefined> {
  const result = await db.execute({
    sql: 'SELECT * FROM daily_burns WHERE date = ? AND chain = ?',
    args: [date, chain],
  });
  return result.rows[0] as unknown as DailyBurn | undefined;
}

export async function upsertDailyBurn(burn: DailyBurn): Promise<void> {
  await db.execute({
    sql: `
      INSERT INTO daily_burns (date, chain, cumulative_uni, daily_uni, uni_price_usd, daily_usd_value, cumulative_usd_value, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date, chain) DO UPDATE SET
        cumulative_uni = excluded.cumulative_uni,
        daily_uni = excluded.daily_uni,
        uni_price_usd = excluded.uni_price_usd,
        daily_usd_value = excluded.daily_usd_value,
        cumulative_usd_value = excluded.cumulative_usd_value,
        updated_at = excluded.updated_at
    `,
    args: [
      burn.date,
      burn.chain,
      burn.cumulative_uni,
      burn.daily_uni,
      burn.uni_price_usd || null,
      burn.daily_usd_value || null,
      burn.cumulative_usd_value || null,
      burn.updated_at,
    ],
  });
}

// --- Burn Transactions ---

export async function getBurnTransactions(chain?: string): Promise<BurnTransaction[]> {
  if (chain) {
    const result = await db.execute({
      sql: `SELECT * FROM burn_transactions WHERE chain = ? ORDER BY timestamp DESC`,
      args: [chain],
    });
    return result.rows as unknown as BurnTransaction[];
  }
  const result = await db.execute(`SELECT * FROM burn_transactions ORDER BY timestamp DESC`);
  return result.rows as unknown as BurnTransaction[];
}

export async function getRecentBurnTransactions(limit: number = 5, chain?: string): Promise<BurnTransaction[]> {
  if (chain) {
    const result = await db.execute({
      sql: `SELECT * FROM burn_transactions WHERE chain = ? ORDER BY timestamp DESC LIMIT ?`,
      args: [chain, limit],
    });
    return result.rows as unknown as BurnTransaction[];
  }
  const result = await db.execute({
    sql: `SELECT * FROM burn_transactions ORDER BY timestamp DESC LIMIT ?`,
    args: [limit],
  });
  return result.rows as unknown as BurnTransaction[];
}

export async function getLatestBurnTransaction(chain: string): Promise<BurnTransaction | undefined> {
  const result = await db.execute({
    sql: `SELECT * FROM burn_transactions WHERE chain = ? ORDER BY block_number DESC LIMIT 1`,
    args: [chain],
  });
  return result.rows[0] as unknown as BurnTransaction | undefined;
}

export async function insertBurnTransaction(tx: BurnTransaction): Promise<void> {
  await db.execute({
    sql: `
      INSERT OR IGNORE INTO burn_transactions
      (tx_hash, chain, block_number, timestamp, uni_amount, uni_price_usd, usd_value, from_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      tx.tx_hash,
      tx.chain,
      tx.block_number,
      tx.timestamp,
      tx.uni_amount,
      tx.uni_price_usd || null,
      tx.usd_value || null,
      tx.from_address,
    ],
  });
}

export async function insertManyBurnTransactions(txs: BurnTransaction[]): Promise<void> {
  const statements = txs.map((tx) => ({
    sql: `
      INSERT OR IGNORE INTO burn_transactions
      (tx_hash, chain, block_number, timestamp, uni_amount, uni_price_usd, usd_value, from_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      tx.tx_hash,
      tx.chain,
      tx.block_number,
      tx.timestamp,
      tx.uni_amount,
      tx.uni_price_usd || null,
      tx.usd_value || null,
      tx.from_address,
    ],
  }));

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

// --- Aggregation Queries ---

export async function getTotalBurned(chain?: string): Promise<number> {
  if (chain) {
    const result = await db.execute({
      sql: `SELECT SUM(uni_amount) as total FROM burn_transactions WHERE chain = ? AND timestamp >= ?`,
      args: [chain, CONSTANTS.START_DATE],
    });
    const row = result.rows[0] as unknown as { total: number | null };
    return row?.total || 0;
  }
  const result = await db.execute({
    sql: `SELECT SUM(uni_amount) as total FROM burn_transactions WHERE timestamp >= ?`,
    args: [CONSTANTS.START_DATE],
  });
  const row = result.rows[0] as unknown as { total: number | null };
  return row?.total || 0;
}

export async function getTodayBurns(chain?: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  if (chain) {
    const result = await db.execute({
      sql: `SELECT SUM(uni_amount) as total FROM burn_transactions WHERE chain = ? AND date(timestamp) = ?`,
      args: [chain, today],
    });
    const row = result.rows[0] as unknown as { total: number | null };
    return row?.total || 0;
  }
  const result = await db.execute({
    sql: `SELECT SUM(uni_amount) as total FROM burn_transactions WHERE date(timestamp) = ?`,
    args: [today],
  });
  const row = result.rows[0] as unknown as { total: number | null };
  return row?.total || 0;
}

export async function getHistoricalUsdValue(chain?: string): Promise<number> {
  if (chain) {
    const result = await db.execute({
      sql: `SELECT SUM(usd_value) as total FROM burn_transactions WHERE chain = ? AND usd_value IS NOT NULL AND timestamp >= ?`,
      args: [chain, CONSTANTS.START_DATE],
    });
    const row = result.rows[0] as unknown as { total: number | null };
    return row?.total || 0;
  }
  const result = await db.execute({
    sql: `SELECT SUM(usd_value) as total FROM burn_transactions WHERE usd_value IS NOT NULL AND timestamp >= ?`,
    args: [CONSTANTS.START_DATE],
  });
  const row = result.rows[0] as unknown as { total: number | null };
  return row?.total || 0;
}

export async function getPerChainSummary(): Promise<Array<{ chain: string; total_uni: number; total_usd: number; today_uni: number }>> {
  const today = new Date().toISOString().split('T')[0];
  const result = await db.execute({
    sql: `
      SELECT
        chain,
        SUM(uni_amount) as total_uni,
        SUM(CASE WHEN usd_value IS NOT NULL THEN usd_value ELSE 0 END) as total_usd,
        SUM(CASE WHEN date(timestamp) = ? THEN uni_amount ELSE 0 END) as today_uni
      FROM burn_transactions
      WHERE timestamp >= ?
      GROUP BY chain
    `,
    args: [today, CONSTANTS.START_DATE],
  });
  return result.rows as unknown as Array<{ chain: string; total_uni: number; total_usd: number; today_uni: number }>;
}

export async function getLatestDailyBurn(): Promise<DailyBurn | undefined> {
  const result = await db.execute(`
    SELECT * FROM daily_burns
    ORDER BY date DESC, updated_at DESC
    LIMIT 1
  `);
  return result.rows[0] as unknown as DailyBurn | undefined;
}

export async function clearAllData(): Promise<void> {
  await db.batch([
    'DELETE FROM daily_burns',
    'DELETE FROM burn_transactions',
  ]);
}
