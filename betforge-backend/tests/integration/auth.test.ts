import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/config/database.js';

const app = createApp();

describe('Auth Routes', () => {
  const testUser = {
    name: 'Teste Integração',
    email: `test.${Date.now()}@betforge.com`,
    cpf: '000.000.000-00',
    phone: '(11) 99999-9999',
    birthdate: '1995-01-01',
    password: 'Password@123',
  };

  let accessToken: string;

  afterAll(async () => {
    await db('users').where({ email: testUser.email }).delete();
    await db.destroy();
  });

  describe('POST /api/v1/auth/register', () => {
    it('deve registrar usuário com dados válidos', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.user).not.toHaveProperty('password_hash');
    });

    it('deve rejeitar e-mail duplicado', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CONFLICT');
    });

    it('deve rejeitar senha fraca', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'outro@test.com', password: '123' });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');

      accessToken = res.body.data.tokens.accessToken;
    });

    it('deve rejeitar senha incorreta', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'SenhaErrada@1',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('deve rejeitar acesso sem token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
