import { neon } from "@neondatabase/serverless";

let sql: ReturnType<typeof neon> | null = null;

if (process.env.DATABASE_URL) {
  sql = neon(process.env.DATABASE_URL);
} else {
  sql = null;
}

export { sql };
