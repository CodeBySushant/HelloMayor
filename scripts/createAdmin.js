const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

async function createAdmin() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Sush@nt.2004",   // 🔴 CHANGE THIS
    database: "hellomayor",    // 🔴 CHANGE THIS
  });

  const username = "admin";
  const password = "1234";

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.query(
    "INSERT INTO admins (username, password) VALUES (?, ?)",
    [username, hashedPassword]
  );

  console.log("✅ Admin created successfully");
  process.exit();
}

createAdmin();