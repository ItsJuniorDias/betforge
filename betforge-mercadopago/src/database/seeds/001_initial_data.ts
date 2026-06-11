import { db } from "../../config/database.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // ─── Admin ──────────────────────────────────────────────────────────────────
  const adminId = uuidv4();
  await db("users")
    .insert({
      id: adminId,
      name: "Administrador",
      email: "admin@betforge.com",
      cpf: "00000000000",
      phone: "11999999999",
      birthdate: "1990-01-01",
      password_hash: await bcrypt.hash("Admin@123", 12),
      role: "admin",
      status: "active",
      kyc_status: "verified",
      level: "platinum",
      balance: 0,
      bonus_balance: 0,
    })
    .onConflict("email")
    .ignore();

  // ─── Usuário de teste ────────────────────────────────────────────────────────
  const userId = uuidv4();
  await db("users")
    .insert({
      id: userId,
      name: "João Silva",
      email: "joao@betforge.com",
      cpf: "12345678901",
      phone: "11988887777",
      birthdate: "1995-05-15",
      password_hash: await bcrypt.hash("User@12345", 12),
      role: "user",
      status: "active",
      kyc_status: "verified",
      level: "gold",
      balance: 1250.0,
      bonus_balance: 50.0,
    })
    .onConflict("email")
    .ignore();

  console.log("✅ Seed de usuários concluído!");
  console.log("");
  console.log("Credenciais de teste:");
  console.log("  Admin → admin@betforge.com / Admin@123");
  console.log("  User  → joao@betforge.com  / User@12345");
  console.log("");
  console.log(
    "ℹ️  Partidas e odds são carregadas automaticamente via The Odds API.",
  );
  console.log(
    '   Execute "npm run seed:odds" para fazer o sync inicial manualmente.',
  );

  await db.destroy();
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
