import request from 'supertest';
import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express, { Request } from 'express';
import cors from 'cors';

// Request型を拡張
interface AuthRequest extends Request {
  userId: string;
}

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

// 簡易フラグ: DB 依存テストを実行するか（デフォルトはスキップ）
const USE_DB = process.env.USE_DB_TESTS === 'true';
const d = USE_DB ? describe : describe.skip;

// テスト用アプリケーション作成（実際のデータベース接続）
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  const prisma = new PrismaClient();
  
  // 実際の認証ルート
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // 既存ユーザーをチェック
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // パスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // ユーザーを作成
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || email.split('@')[0]
        }
      });
      
      // デフォルトグループを作成
      const group = await prisma.group.create({
        data: {
          name: `${user.name}の個人グループ`,
          description: '個人用のデフォルトグループ',
          createdBy: user.id
        }
      });
      
      // ユーザーをグループのオーナーとして追加
      await prisma.groupMember.create({
        data: {
          userId: user.id,
          groupId: group.id,
          role: 'OWNER'
        }
      });
      
      // JWTトークンを生成
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );
      
      res.status(201).json({
        message: 'User registered successfully',
        user: { id: user.id, email: user.email, name: user.name },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // ユーザーを検索
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // パスワードを検証
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // JWTトークンを生成
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );
      
      res.status(200).json({
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  return app;
};

describe('認証API テスト（DB接続版）', () => {
  let app: express.Application;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = createTestApp();
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // テスト前にデータベースをクリーンアップ
    await prisma.todo.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
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

      // データベースにユーザーが作成されていることを確認
      const createdUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      expect(createdUser).not.toBeNull();
      expect(createdUser?.name).toBe(userData.name);

      // デフォルトグループが作成されていることを確認
      const groups = await prisma.group.findMany({
        where: { createdBy: createdUser?.id }
      });
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe(`${userData.name}の個人グループ`);
    });

    it('既存のメールアドレスで登録しようとするとエラーになる', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      // 最初のユーザーを作成
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // 同じメールアドレスで再度登録を試行
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User already exists');
    });

    it('必須フィールドが不足している場合エラーになる', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // password が不足
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
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

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });

  describe('POST /api/auth/login', () => {
    it('正しい認証情報でログインできる', async () => {
      // まずユーザーを登録
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // ログインをテスト
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('name', 'Test User');
    });

    it('間違ったパスワードでログインできない', async () => {
      // まずユーザーを登録
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // 間違ったパスワードでログインを試行
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('存在しないユーザーでログインできない', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('必須フィールドが不足している場合エラーになる', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // password が不足
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });
});
