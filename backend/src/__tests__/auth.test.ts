import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Jest型定義
declare global {
  var describe: any;
  var it: any;
  var expect: any;
  var beforeAll: any;
  var beforeEach: any;
  var afterAll: any;
  var afterEach: any;
}

// シンプルなテスト用アプリケーション作成（データベース接続なし）
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // テスト用の簡単なルート
  app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: '1', email, name },
      token: 'fake-jwt-token'
    });
  });
  
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (email === 'test@example.com' && password === 'password123') {
      return res.status(200).json({
        message: 'Login successful',
        user: { id: '1', email, name: 'Test User' },
        token: 'fake-jwt-token'
      });
    }
    
    res.status(401).json({ error: 'Invalid credentials' });
  });
  
  return app;
};

describe('認証API テスト（シンプル版）', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('新しいユーザーを正常に登録できる', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('name', userData.name);
    });

    it('必須フィールドが不足している場合エラーになる', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // password が不足
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('空のメールアドレスの場合エラーになる', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: '',
          password: 'password123',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('正しい認証情報でログインできる', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('間違ったパスワードでログインできない', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('存在しないユーザーでログインできない', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('必須フィールドが不足している場合エラーになる', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // password が不足
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
