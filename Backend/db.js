import pg from "pg";

const { Pool } = pg;

const {
  DATABASE_URL,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  NODE_ENV
} = process.env;

// SSL only in production
const sslConfig =
  NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false;

const pool = DATABASE_URL
  ? new Pool({
    connectionString: DATABASE_URL,
    ssl: sslConfig
  })
  : new Pool({
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : undefined,
    user: DB_USER,
    password: DB_PASSWORD ? String(DB_PASSWORD) : undefined,
    database: DB_NAME,
    ssl: sslConfig
  });

pool.on("error", (err) => {
  console.error("Unexpected PG pool error", err);
});

export default pool;

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      name TEXT,
      google_id TEXT,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      text TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      target_amount NUMERIC NOT NULL,
      month TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE IF EXISTS transactions
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'debited',
    ADD COLUMN IF NOT EXISTS bank_name TEXT,
    ADD COLUMN IF NOT EXISTS available_balance NUMERIC;
  `);

  await pool.query(`
    ALTER TABLE IF EXISTS goals
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_cards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      card_name TEXT NOT NULL,
      bank TEXT,
      card_type TEXT,
      last_digits VARCHAR(4),
      network TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE IF EXISTS user_cards
    ADD COLUMN IF NOT EXISTS last_digits VARCHAR(4),
    ADD COLUMN IF NOT EXISTS network TEXT;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON user_cards(user_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS category_goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      limit_amount NUMERIC NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, category)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offers(
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      discount_percentage NUMERIC DEFAULT 0,
      category TEXT,
      merchant TEXT,
      card_required TEXT,
      min_spend NUMERIC DEFAULT 0,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const offersCount = await pool.query("SELECT COUNT(*) FROM offers");
  if (parseInt(offersCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO offers(title, description, discount_percentage, category, merchant, card_required, min_spend)
      VALUES
        ('HDFC Amazon Offer', '10% off on Amazon for HDFC cards', 10, 'shopping', 'amazon', 'HDFC', 1000),
        ('Zomato Gold', 'Flat 50% off on dining', 50, 'dining', 'zomato', 'Any', 200),
        ('Uber Weekly', '5% cashback on rides', 5, 'travel', 'uber', 'Titanium', 0),
        ('Myntra Sale', '15% off using Axis Bank', 15, 'shopping', 'myntra', 'Axis', 1500);
    `);
    console.log("Seeded sample offers.");
  }
}
