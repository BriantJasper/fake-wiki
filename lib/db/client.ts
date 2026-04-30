import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/* ============================================================================
   Lazy Drizzle client.

   Throwing at module load would crash `next build` in environments where the
   DATABASE_URL isn't available at compile time (CI, local typechecks). The
   proxy below defers the connection until a query actually runs.
   ============================================================================ */

type Db = NeonHttpDatabase<typeof schema>;

let _client: NeonQueryFunction<false, false> | null = null;
let _db: Db | null = null;

function getDb(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.',
    );
  }
  _client = neon(url);
  _db = drizzle({ client: _client, schema });
  return _db;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export { schema };
