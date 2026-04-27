import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export interface ProductRow {
  brand: string;
  name: string;
  price: number | null;
  currency: string;
  properties: Record<string, string>;
  original_url: string;
  local_image_path: string;
}

let db: Database.Database;

/**
 * Initialise the SQLite database and create the products table if needed.
 */
export function initDb(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath, {
    verbose: console.log,
  });

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      brand            TEXT    NOT NULL,
      name             TEXT    NOT NULL,
      price            REAL,
      currency         TEXT    NOT NULL DEFAULT 'VND',
      properties       TEXT    NOT NULL DEFAULT '{}',
      original_url     TEXT    NOT NULL UNIQUE,
      local_image_path TEXT    NOT NULL DEFAULT '',
      created_at       TEXT    NOT NULL,
      updated_at       TEXT    NOT NULL
    );
  `);
}

/**
 * Insert or update a product row keyed on original_url.
 */
export function upsertProduct(product: ProductRow): void {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO products (brand, name, price, currency, properties, original_url, local_image_path, created_at, updated_at)
    VALUES (@brand, @name, @price, @currency, @properties, @original_url, @local_image_path, @created_at, @updated_at)
    ON CONFLICT(original_url) DO UPDATE SET
      brand            = excluded.brand,
      name             = excluded.name,
      price            = excluded.price,
      currency         = excluded.currency,
      properties       = excluded.properties,
      local_image_path = excluded.local_image_path,
      updated_at       = excluded.updated_at
  `);

  stmt.run({
    brand: product.brand,
    name: product.name,
    price: product.price,
    currency: product.currency,
    properties: JSON.stringify(product.properties),
    original_url: product.original_url,
    local_image_path: product.local_image_path,
    created_at: now,
    updated_at: now,
  });
}

/** Return the underlying db instance (for testing or inspection). */
export function getDb(): Database.Database {
  return db;
}
