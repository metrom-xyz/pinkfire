import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Check if tables exist and need migration
        let needsMigration = false;
        try {
            await db.execute('SELECT chain FROM burn_transactions LIMIT 1');
        } catch {
            needsMigration = true;
        }

        if (needsMigration) {
            // Check if old tables exist (without chain column)
            let oldTablesExist = false;
            try {
                await db.execute('SELECT tx_hash FROM burn_transactions LIMIT 1');
                oldTablesExist = true;
            } catch {
                // Tables don't exist at all
            }

            if (oldTablesExist) {
                // Migrate: add chain column to existing tables
                console.log('Migrating existing tables to add chain column...');

                await db.execute(`ALTER TABLE burn_transactions ADD COLUMN chain TEXT DEFAULT 'ethereum'`);
                await db.execute(`ALTER TABLE daily_burns ADD COLUMN chain TEXT DEFAULT 'ethereum'`);

                // Recreate tables with new composite primary keys
                // 1. Create new tables
                await db.execute(`
                    CREATE TABLE IF NOT EXISTS burn_transactions_new (
                        tx_hash TEXT NOT NULL,
                        chain TEXT NOT NULL DEFAULT 'ethereum',
                        block_number INTEGER NOT NULL,
                        timestamp TEXT NOT NULL,
                        uni_amount REAL NOT NULL,
                        uni_price_usd REAL,
                        usd_value REAL,
                        from_address TEXT NOT NULL,
                        PRIMARY KEY (tx_hash, chain)
                    )
                `);
                await db.execute(`
                    CREATE TABLE IF NOT EXISTS daily_burns_new (
                        date TEXT NOT NULL,
                        chain TEXT NOT NULL DEFAULT 'ethereum',
                        cumulative_uni REAL NOT NULL,
                        daily_uni REAL NOT NULL,
                        uni_price_usd REAL,
                        daily_usd_value REAL,
                        cumulative_usd_value REAL,
                        updated_at TEXT NOT NULL,
                        PRIMARY KEY (date, chain)
                    )
                `);

                // 2. Copy data
                await db.execute(`INSERT INTO burn_transactions_new SELECT tx_hash, chain, block_number, timestamp, uni_amount, uni_price_usd, usd_value, from_address FROM burn_transactions`);
                await db.execute(`INSERT INTO daily_burns_new SELECT date, chain, cumulative_uni, daily_uni, uni_price_usd, daily_usd_value, cumulative_usd_value, updated_at FROM daily_burns`);

                // 3. Drop old, rename new
                await db.execute(`DROP TABLE burn_transactions`);
                await db.execute(`DROP TABLE daily_burns`);
                await db.execute(`ALTER TABLE burn_transactions_new RENAME TO burn_transactions`);
                await db.execute(`ALTER TABLE daily_burns_new RENAME TO daily_burns`);

                // 4. Recreate indexes
                await db.execute(`CREATE INDEX IF NOT EXISTS idx_burn_transactions_timestamp ON burn_transactions(timestamp)`);
                await db.execute(`CREATE INDEX IF NOT EXISTS idx_burn_transactions_chain ON burn_transactions(chain)`);
                await db.execute(`CREATE INDEX IF NOT EXISTS idx_daily_burns_date ON daily_burns(date)`);
                await db.execute(`CREATE INDEX IF NOT EXISTS idx_daily_burns_chain ON daily_burns(chain)`);

                console.log('Migration complete.');
                return NextResponse.json({ success: true, message: 'Database migrated successfully (added chain support)' });
            }
        }

        // Fresh creation with chain support
        await db.execute(`
            CREATE TABLE IF NOT EXISTS daily_burns (
                date TEXT NOT NULL,
                chain TEXT NOT NULL DEFAULT 'ethereum',
                cumulative_uni REAL NOT NULL,
                daily_uni REAL NOT NULL,
                uni_price_usd REAL,
                daily_usd_value REAL,
                cumulative_usd_value REAL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (date, chain)
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS burn_transactions (
                tx_hash TEXT NOT NULL,
                chain TEXT NOT NULL DEFAULT 'ethereum',
                block_number INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                uni_amount REAL NOT NULL,
                uni_price_usd REAL,
                usd_value REAL,
                from_address TEXT NOT NULL,
                PRIMARY KEY (tx_hash, chain)
            )
        `);

        await db.execute(`CREATE INDEX IF NOT EXISTS idx_burn_transactions_timestamp ON burn_transactions(timestamp)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_burn_transactions_chain ON burn_transactions(chain)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_daily_burns_date ON daily_burns(date)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_daily_burns_chain ON daily_burns(chain)`);

        return NextResponse.json({ success: true, message: 'Database initialized successfully' });
    } catch (error) {
        console.error('Error initializing database:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
