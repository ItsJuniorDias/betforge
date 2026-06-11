import { db } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // ─── Admin ────────────────────────────────────────────────────────────────────
  const adminId = uuidv4();
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  await db('users')
    .insert({
      id: adminId,
      name: 'Administrador',
      email: 'admin@betforge.com',
      cpf: '00000000000',
      phone: '11999999999',
      birthdate: '1990-01-01',
      password_hash: passwordHash,
      role: 'admin',
      status: 'active',
      kyc_status: 'verified',
      level: 'platinum',
      balance: 0,
      bonus_balance: 0,
    })
    .onConflict('email')
    .ignore();

  // ─── Usuário de teste ─────────────────────────────────────────────────────────
  const userId = uuidv4();
  const userHash = await bcrypt.hash('User@12345', 12);

  await db('users')
    .insert({
      id: userId,
      name: 'João Silva',
      email: 'joao@betforge.com',
      cpf: '12345678901',
      phone: '11988887777',
      birthdate: '1995-05-15',
      password_hash: userHash,
      role: 'user',
      status: 'active',
      kyc_status: 'verified',
      level: 'gold',
      balance: 1250.00,
      bonus_balance: 50.00,
    })
    .onConflict('email')
    .ignore();

  // ─── Partidas ─────────────────────────────────────────────────────────────────
  const matches = [
    {
      id: uuidv4(),
      sport: 'football',
      league_id: 'brasileirao',
      home_team: 'Flamengo',
      away_team: 'Corinthians',
      status: 'live',
      starts_at: new Date(),
      home_score: 2,
      away_score: 1,
      minute: 67,
    },
    {
      id: uuidv4(),
      sport: 'football',
      league_id: 'champions',
      home_team: 'Real Madrid',
      away_team: 'Manchester City',
      status: 'live',
      starts_at: new Date(),
      home_score: 0,
      away_score: 0,
      minute: 34,
    },
    {
      id: uuidv4(),
      sport: 'football',
      league_id: 'laliga',
      home_team: 'Barcelona',
      away_team: 'Atlético Madrid',
      status: 'scheduled',
      starts_at: new Date(Date.now() + 3 * 60 * 60 * 1000),
    },
    {
      id: uuidv4(),
      sport: 'basketball',
      league_id: 'nba',
      home_team: 'Lakers',
      away_team: 'Warriors',
      status: 'live',
      starts_at: new Date(),
      home_score: 88,
      away_score: 91,
      period: 'Q3 8:24',
    },
    {
      id: uuidv4(),
      sport: 'football',
      league_id: 'brasileirao',
      home_team: 'Palmeiras',
      away_team: 'São Paulo',
      status: 'scheduled',
      starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  ];

  for (const match of matches) {
    await db('matches').insert(match).onConflict('id').ignore();

    // Criar mercado 1X2 para cada partida
    const marketId = uuidv4();
    await db('markets')
      .insert({ id: marketId, match_id: match.id, label: 'Resultado Final', type: '1x2', is_active: true })
      .onConflict('id')
      .ignore();

    // Criar odds 1X2
    const isBasketball = match.sport === 'basketball';
    const odds = isBasketball
      ? [
          { pick: 'home', label: match.home_team, value: 2.10 },
          { pick: 'away', label: match.away_team, value: 1.75 },
        ]
      : [
          { pick: 'home', label: match.home_team, value: +(1.5 + Math.random()).toFixed(2) },
          { pick: 'draw', label: 'Empate', value: +(3.0 + Math.random() * 0.5).toFixed(2) },
          { pick: 'away', label: match.away_team, value: +(2.5 + Math.random() * 2).toFixed(2) },
        ];

    for (const odd of odds) {
      await db('odds')
        .insert({ id: uuidv4(), market_id: marketId, ...odd, is_active: true })
        .onConflict('id')
        .ignore();
    }
  }

  console.log('✅ Seed concluído com sucesso!');
  console.log('');
  console.log('Credenciais de teste:');
  console.log('  Admin → admin@betforge.com / Admin@123');
  console.log('  User  → joao@betforge.com  / User@12345');

  await db.destroy();
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
