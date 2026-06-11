import { db } from '../../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function odd(v: number) { return parseFloat(v.toFixed(2)); }

async function createMarket(
  matchId: string,
  label: string,
  type: string,
  picks: Array<{ pick: string; label: string; value: number }>,
) {
  const marketId = uuidv4();
  await db('markets')
    .insert({ id: marketId, match_id: matchId, label, type, is_active: true })
    .onConflict('id').ignore();

  for (const p of picks) {
    await db('odds')
      .insert({ id: uuidv4(), market_id: marketId, pick: p.pick, label: p.label, value: p.value, is_active: true })
      .onConflict('id').ignore();
  }
  return marketId;
}

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // ─── Admin ──────────────────────────────────────────────────────────────────
  const adminId = uuidv4();
  await db('users').insert({
    id: adminId,
    name: 'Administrador',
    email: 'admin@betforge.com',
    cpf: '00000000000',
    phone: '11999999999',
    birthdate: '1990-01-01',
    password_hash: await bcrypt.hash('Admin@123', 12),
    role: 'admin',
    status: 'active',
    kyc_status: 'verified',
    level: 'platinum',
    balance: 0,
    bonus_balance: 0,
  }).onConflict('email').ignore();

  // ─── Usuário de teste ────────────────────────────────────────────────────────
  const userId = uuidv4();
  await db('users').insert({
    id: userId,
    name: 'João Silva',
    email: 'joao@betforge.com',
    cpf: '12345678901',
    phone: '11988887777',
    birthdate: '1995-05-15',
    password_hash: await bcrypt.hash('User@12345', 12),
    role: 'user',
    status: 'active',
    kyc_status: 'verified',
    level: 'gold',
    balance: 1250.00,
    bonus_balance: 50.00,
  }).onConflict('email').ignore();

  // ─── Partidas ─────────────────────────────────────────────────────────────────
  // Cada partida replica exatamente os dados do mockData.js para compatibilidade
  const now = new Date();
  const h = (n: number) => new Date(now.getTime() + n * 3_600_000);

  const matchDefs: Array<{
    sport: string; league_id: string; league_label: string; league_flag: string;
    round: string; home_team: string; away_team: string;
    home_emoji: string; away_emoji: string;
    home_score?: number; away_score?: number;
    status: string; starts_at: Date;
    minute?: number; period?: string;
    markets: Array<{ label: string; type: string; picks: Array<{ pick: string; label: string; value: number }> }>;
  }> = [
    // ── AO VIVO ──────────────────────────────────────────────────────────────
    {
      sport: 'football', league_id: 'brasileirao', league_label: 'Brasileirão',
      league_flag: '🇧🇷', round: 'Rod. 12',
      home_team: 'Flamengo', away_team: 'Corinthians',
      home_emoji: '🔴', away_emoji: '⚫',
      home_score: 2, away_score: 1, status: 'live', starts_at: now, minute: 67,
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'Flamengo', value: 1.45 },
          { pick: 'draw', label: 'Empate',   value: 4.20 },
          { pick: 'away', label: 'Corinthians', value: 6.50 },
        ]},
        { label: 'Mais/Menos 2.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 2.5', value: 1.55 },
          { pick: 'under', label: 'Menos de 2.5', value: 2.35 },
        ]},
        { label: 'Mais/Menos 3.5', type: 'over_under_35', picks: [
          { pick: 'over',  label: 'Mais de 3.5', value: 2.70 },
          { pick: 'under', label: 'Menos de 3.5', value: 1.45 },
        ]},
        { label: 'Ambas Marcam', type: 'btts', picks: [
          { pick: 'yes', label: 'Sim', value: 1.72 },
          { pick: 'no',  label: 'Não', value: 2.10 },
        ]},
        { label: 'Handicap Asiático Casa (-1)', type: 'asian_handicap', picks: [
          { pick: 'home_-1', label: 'Casa -1',  value: 2.15 },
          { pick: 'away_+1', label: 'Fora +1',  value: 1.72 },
        ]},
        { label: 'Placar Exato (mais prováveis)', type: 'correct_score', picks: [
          { pick: '2-1', label: '2-1', value: 7.50 },
          { pick: '3-1', label: '3-1', value: 10.0 },
          { pick: '2-2', label: '2-2', value: 11.0 },
          { pick: '1-1', label: '1-1', value: 8.50 },
        ]},
        { label: 'Artilheiro — Marcar a qualquer hora', type: 'anytime_scorer', picks: [
          { pick: 'gabriel',   label: 'Gabigol',     value: 2.20 },
          { pick: 'pedro',     label: 'Pedro',       value: 2.60 },
          { pick: 'yuri',      label: 'Yuri Alberto', value: 2.80 },
          { pick: 'renato',    label: 'Renato Augusto', value: 3.40 },
        ]},
        { label: 'Intervalo / Final', type: 'halftime_fulltime', picks: [
          { pick: 'home/home', label: 'Casa / Casa', value: 2.40 },
          { pick: 'draw/home', label: 'Empate / Casa', value: 5.50 },
          { pick: 'home/draw', label: 'Casa / Empate', value: 9.00 },
          { pick: 'draw/draw', label: 'Empate / Empate', value: 8.50 },
        ]},
        { label: 'Cantos — Mais/Menos 9.5', type: 'corners', picks: [
          { pick: 'over',  label: 'Mais de 9.5', value: 1.90 },
          { pick: 'under', label: 'Menos de 9.5', value: 1.90 },
        ]},
        { label: 'Cartões — Mais/Menos 3.5', type: 'cards', picks: [
          { pick: 'over',  label: 'Mais de 3.5', value: 1.80 },
          { pick: 'under', label: 'Menos de 3.5', value: 2.00 },
        ]},
      ],
    },
    {
      sport: 'football', league_id: 'champions', league_label: 'Champions League',
      league_flag: '🏆', round: 'QF - 1ª Mão',
      home_team: 'Real Madrid', away_team: 'Manchester City',
      home_emoji: '⚪', away_emoji: '🔵',
      home_score: 0, away_score: 0, status: 'live', starts_at: now, minute: 34,
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'Real Madrid', value: 2.15 },
          { pick: 'draw', label: 'Empate',      value: 3.40 },
          { pick: 'away', label: 'Man City',    value: 3.10 },
        ]},
        { label: 'Mais/Menos 2.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 2.5',  value: 1.85 },
          { pick: 'under', label: 'Menos de 2.5', value: 1.95 },
        ]},
        { label: 'Ambas Marcam', type: 'btts', picks: [
          { pick: 'yes', label: 'Sim', value: 1.65 },
          { pick: 'no',  label: 'Não', value: 2.25 },
        ]},
        { label: 'Handicap Asiático', type: 'asian_handicap', picks: [
          { pick: 'home_+0', label: 'Real Madrid +0', value: 2.10 },
          { pick: 'away_+0', label: 'Man City +0',    value: 1.75 },
        ]},
        { label: 'Placar Exato (mais prováveis)', type: 'correct_score', picks: [
          { pick: '1-1', label: '1-1', value: 7.00 },
          { pick: '1-0', label: '1-0', value: 9.00 },
          { pick: '0-1', label: '0-1', value: 8.50 },
          { pick: '2-1', label: '2-1', value: 11.0 },
          { pick: '1-2', label: '1-2', value: 12.0 },
        ]},
        { label: 'Gols Casa — Mais/Menos 1.5', type: 'team_goals', picks: [
          { pick: 'home_over',  label: 'Real Madrid +1.5', value: 2.35 },
          { pick: 'home_under', label: 'Real Madrid -1.5', value: 1.60 },
        ]},
        { label: 'Cantos — Mais/Menos 10.5', type: 'corners', picks: [
          { pick: 'over',  label: 'Mais de 10.5', value: 1.95 },
          { pick: 'under', label: 'Menos de 10.5', value: 1.85 },
        ]},
      ],
    },
    {
      sport: 'football', league_id: 'laliga', league_label: 'La Liga',
      league_flag: '🇪🇸', round: 'Rod. 34',
      home_team: 'Sevilla', away_team: 'Valencia',
      home_emoji: '🔴', away_emoji: '🦇',
      home_score: 1, away_score: 1, status: 'live', starts_at: now, minute: 78,
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'Sevilla',  value: 2.80 },
          { pick: 'draw', label: 'Empate',   value: 3.20 },
          { pick: 'away', label: 'Valencia', value: 2.60 },
        ]},
        { label: 'Mais/Menos 2.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 2.5',  value: 2.05 },
          { pick: 'under', label: 'Menos de 2.5', value: 1.75 },
        ]},
        { label: 'Ambas Marcam', type: 'btts', picks: [
          { pick: 'yes', label: 'Sim', value: 1.60 },
          { pick: 'no',  label: 'Não', value: 2.30 },
        ]},
      ],
    },
    {
      sport: 'basketball', league_id: 'nba', league_label: 'NBA',
      league_flag: '🏀', round: 'Playoffs - R2',
      home_team: 'Lakers', away_team: 'Warriors',
      home_emoji: '💜', away_emoji: '💛',
      home_score: 88, away_score: 91, status: 'live', starts_at: now,
      period: 'Q3 8:24',
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'Lakers',  value: 2.10 },
          { pick: 'away', label: 'Warriors', value: 1.75 },
        ]},
        { label: 'Total de Pontos — Mais/Menos 218.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 218.5', value: 1.90 },
          { pick: 'under', label: 'Menos de 218.5', value: 1.90 },
        ]},
        { label: 'Handicap (Pontos)', type: 'point_spread', picks: [
          { pick: 'home_-3.5', label: 'Lakers -3.5', value: 1.95 },
          { pick: 'away_+3.5', label: 'Warriors +3.5', value: 1.85 },
        ]},
        { label: 'Vencedor do 3º Quarto', type: 'quarter_winner', picks: [
          { pick: 'home_q3', label: 'Lakers',  value: 2.00 },
          { pick: 'away_q3', label: 'Warriors', value: 1.80 },
        ]},
      ],
    },
    {
      sport: 'football', league_id: 'seriea', league_label: 'Serie A',
      league_flag: '🇮🇹', round: 'Rod. 36',
      home_team: 'Inter de Milão', away_team: 'AC Milan',
      home_emoji: '🔵⚫', away_emoji: '🔴⚫',
      home_score: 0, away_score: 0, status: 'live', starts_at: now, minute: 12,
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'Inter de Milão', value: 2.00 },
          { pick: 'draw', label: 'Empate',         value: 3.30 },
          { pick: 'away', label: 'AC Milan',        value: 3.60 },
        ]},
        { label: 'Mais/Menos 2.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 2.5',  value: 1.90 },
          { pick: 'under', label: 'Menos de 2.5', value: 1.90 },
        ]},
        { label: 'Ambas Marcam', type: 'btts', picks: [
          { pick: 'yes', label: 'Sim', value: 1.72 },
          { pick: 'no',  label: 'Não', value: 2.10 },
        ]},
      ],
    },
    {
      sport: 'football', league_id: 'premier', league_label: 'Premier League',
      league_flag: '🏴', round: 'Rod. 37',
      home_team: 'Arsenal', away_team: 'Tottenham',
      home_emoji: '🔴', away_emoji: '⚪',
      home_score: 3, away_score: 1, status: 'live', starts_at: now, minute: 82,
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'Arsenal',   value: 1.15 },
          { pick: 'draw', label: 'Empate',    value: 7.00 },
          { pick: 'away', label: 'Tottenham', value: 14.0 },
        ]},
        { label: 'Mais/Menos 4.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 4.5',  value: 1.65 },
          { pick: 'under', label: 'Menos de 4.5', value: 2.20 },
        ]},
        { label: 'Próximo gol', type: 'next_goal', picks: [
          { pick: 'home_next', label: 'Arsenal', value: 1.50 },
          { pick: 'away_next', label: 'Tottenham', value: 2.80 },
          { pick: 'no_goal',   label: 'Sem gol',   value: 4.00 },
        ]},
      ],
    },

    // ── PRÓXIMOS JOGOS ─────────────────────────────────────────────────────────
    {
      sport: 'football', league_id: 'laliga', league_label: 'La Liga',
      league_flag: '🇪🇸', round: 'Rod. 34',
      home_team: 'Barcelona', away_team: 'Atlético Madrid',
      home_emoji: '🔵🔴', away_emoji: '🔴⚪',
      status: 'scheduled', starts_at: h(3),
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'Barcelona',       value: 1.75 },
          { pick: 'draw', label: 'Empate',           value: 3.60 },
          { pick: 'away', label: 'Atlético Madrid', value: 4.80 },
        ]},
        { label: 'Mais/Menos 2.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 2.5',  value: 1.75 },
          { pick: 'under', label: 'Menos de 2.5', value: 2.05 },
        ]},
        { label: 'Ambas Marcam', type: 'btts', picks: [
          { pick: 'yes', label: 'Sim', value: 1.68 },
          { pick: 'no',  label: 'Não', value: 2.15 },
        ]},
        { label: 'Handicap Asiático Casa (-1)', type: 'asian_handicap', picks: [
          { pick: 'home_-1', label: 'Barcelona -1',         value: 2.75 },
          { pick: 'away_+1', label: 'Atlético Madrid +1',  value: 1.50 },
        ]},
        { label: 'Placar Exato', type: 'correct_score', picks: [
          { pick: '2-0', label: '2-0', value: 8.00 },
          { pick: '2-1', label: '2-1', value: 7.50 },
          { pick: '1-0', label: '1-0', value: 9.50 },
          { pick: '1-1', label: '1-1', value: 6.50 },
          { pick: '0-1', label: '0-1', value: 14.0 },
          { pick: '3-1', label: '3-1', value: 12.0 },
        ]},
        { label: 'Cantos — Mais/Menos 9.5', type: 'corners', picks: [
          { pick: 'over',  label: 'Mais de 9.5',  value: 1.90 },
          { pick: 'under', label: 'Menos de 9.5', value: 1.90 },
        ]},
        { label: 'Cartões — Mais/Menos 3.5', type: 'cards', picks: [
          { pick: 'over',  label: 'Mais de 3.5',  value: 1.85 },
          { pick: 'under', label: 'Menos de 3.5', value: 1.95 },
        ]},
      ],
    },
    {
      sport: 'football', league_id: 'premier', league_label: 'Premier League',
      league_flag: '🏴', round: 'Rod. 37',
      home_team: 'Chelsea', away_team: 'Liverpool',
      home_emoji: '🔵', away_emoji: '🔴',
      status: 'scheduled', starts_at: h(24),
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'Chelsea',   value: 3.20 },
          { pick: 'draw', label: 'Empate',    value: 3.50 },
          { pick: 'away', label: 'Liverpool', value: 2.10 },
        ]},
        { label: 'Mais/Menos 2.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 2.5',  value: 1.80 },
          { pick: 'under', label: 'Menos de 2.5', value: 2.00 },
        ]},
        { label: 'Ambas Marcam', type: 'btts', picks: [
          { pick: 'yes', label: 'Sim', value: 1.70 },
          { pick: 'no',  label: 'Não', value: 2.10 },
        ]},
        { label: 'Handicap Asiático', type: 'asian_handicap', picks: [
          { pick: 'home_+1', label: 'Chelsea +1',   value: 1.55 },
          { pick: 'away_-1', label: 'Liverpool -1', value: 2.45 },
        ]},
        { label: 'Placar Exato', type: 'correct_score', picks: [
          { pick: '1-2', label: '1-2', value: 8.50 },
          { pick: '0-1', label: '0-1', value: 9.00 },
          { pick: '1-1', label: '1-1', value: 7.00 },
          { pick: '2-1', label: '2-1', value: 11.0 },
          { pick: '0-2', label: '0-2', value: 10.0 },
        ]},
      ],
    },
    {
      sport: 'football', league_id: 'bundesliga', league_label: 'Bundesliga',
      league_flag: '🇩🇪', round: 'Rod. 33',
      home_team: 'Bayern München', away_team: 'Borussia Dortmund',
      home_emoji: '🔴', away_emoji: '🟡',
      status: 'scheduled', starts_at: h(48),
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'Bayern München',      value: 1.60 },
          { pick: 'draw', label: 'Empate',               value: 4.20 },
          { pick: 'away', label: 'Borussia Dortmund',   value: 5.50 },
        ]},
        { label: 'Mais/Menos 3.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 3.5',  value: 1.80 },
          { pick: 'under', label: 'Menos de 3.5', value: 2.00 },
        ]},
        { label: 'Ambas Marcam', type: 'btts', picks: [
          { pick: 'yes', label: 'Sim', value: 1.60 },
          { pick: 'no',  label: 'Não', value: 2.30 },
        ]},
        { label: 'Handicap Asiático Casa (-1.5)', type: 'asian_handicap', picks: [
          { pick: 'home_-1.5', label: 'Bayern -1.5',      value: 2.15 },
          { pick: 'away_+1.5', label: 'Dortmund +1.5',   value: 1.70 },
        ]},
        { label: 'Gols Casa — Mais/Menos 2.5', type: 'team_goals', picks: [
          { pick: 'home_over',  label: 'Bayern +2.5',  value: 2.10 },
          { pick: 'home_under', label: 'Bayern -2.5',  value: 1.70 },
        ]},
        { label: 'Cantos — Mais/Menos 11.5', type: 'corners', picks: [
          { pick: 'over',  label: 'Mais de 11.5',  value: 1.90 },
          { pick: 'under', label: 'Menos de 11.5', value: 1.90 },
        ]},
      ],
    },
    {
      sport: 'football', league_id: 'champions', league_label: 'Champions League',
      league_flag: '🏆', round: 'QF - 1ª Mão',
      home_team: 'PSG', away_team: 'Arsenal',
      home_emoji: '🔵🔴', away_emoji: '🔴⚪',
      status: 'scheduled', starts_at: h(72),
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'PSG',    value: 2.25 },
          { pick: 'draw', label: 'Empate', value: 3.30 },
          { pick: 'away', label: 'Arsenal', value: 3.00 },
        ]},
        { label: 'Mais/Menos 2.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 2.5',  value: 1.85 },
          { pick: 'under', label: 'Menos de 2.5', value: 1.95 },
        ]},
        { label: 'Ambas Marcam', type: 'btts', picks: [
          { pick: 'yes', label: 'Sim', value: 1.65 },
          { pick: 'no',  label: 'Não', value: 2.25 },
        ]},
      ],
    },
    {
      sport: 'football', league_id: 'brasileirao', league_label: 'Brasileirão',
      league_flag: '🇧🇷', round: 'Rod. 13',
      home_team: 'Palmeiras', away_team: 'São Paulo',
      home_emoji: '🟢', away_emoji: '🔴',
      status: 'scheduled', starts_at: h(96),
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'Palmeiras', value: 2.10 },
          { pick: 'draw', label: 'Empate',    value: 3.20 },
          { pick: 'away', label: 'São Paulo', value: 3.50 },
        ]},
        { label: 'Mais/Menos 2.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 2.5',  value: 1.90 },
          { pick: 'under', label: 'Menos de 2.5', value: 1.90 },
        ]},
        { label: 'Ambas Marcam', type: 'btts', picks: [
          { pick: 'yes', label: 'Sim', value: 1.75 },
          { pick: 'no',  label: 'Não', value: 2.05 },
        ]},
        { label: 'Handicap Asiático', type: 'asian_handicap', picks: [
          { pick: 'home_-0.5', label: 'Palmeiras -0.5', value: 2.15 },
          { pick: 'away_+0.5', label: 'São Paulo +0.5', value: 1.70 },
        ]},
      ],
    },
    {
      sport: 'basketball', league_id: 'nba', league_label: 'NBA',
      league_flag: '🏀', round: 'Playoffs - R2',
      home_team: 'Celtics', away_team: 'Knicks',
      home_emoji: '🍀', away_emoji: '🗽',
      status: 'scheduled', starts_at: h(28),
      markets: [
        { label: 'Resultado Final', type: '1x2', picks: [
          { pick: 'home', label: 'Celtics', value: 1.55 },
          { pick: 'away', label: 'Knicks',  value: 2.40 },
        ]},
        { label: 'Total de Pontos — Mais/Menos 224.5', type: 'over_under', picks: [
          { pick: 'over',  label: 'Mais de 224.5', value: 1.90 },
          { pick: 'under', label: 'Menos de 224.5', value: 1.90 },
        ]},
        { label: 'Handicap (Pontos)', type: 'point_spread', picks: [
          { pick: 'home_-5.5', label: 'Celtics -5.5', value: 1.90 },
          { pick: 'away_+5.5', label: 'Knicks +5.5',  value: 1.90 },
        ]},
      ],
    },
  ];

  // ─── Inserir partidas e mercados ─────────────────────────────────────────────
  for (const def of matchDefs) {
    const matchId = uuidv4();
    let marketsCount = def.markets.length;

    await db('matches').insert({
      id: matchId,
      sport: def.sport,
      league_id: def.league_id,
      league_label: def.league_label,
      league_flag: def.league_flag,
      round: def.round,
      home_team: def.home_team,
      away_team: def.away_team,
      home_emoji: def.home_emoji,
      away_emoji: def.away_emoji,
      home_score: def.home_score ?? 0,
      away_score: def.away_score ?? 0,
      status: def.status,
      starts_at: def.starts_at,
      minute: def.minute ?? null,
      period: def.period ?? null,
      markets_count: marketsCount,
    }).onConflict('id').ignore();

    for (const m of def.markets) {
      await createMarket(matchId, m.label, m.type, m.picks.map(p => ({
        ...p, value: odd(p.value),
      })));
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
