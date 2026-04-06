// /lib/db.ts
import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Sush@nt.2004",
  database: "aura_db",
});