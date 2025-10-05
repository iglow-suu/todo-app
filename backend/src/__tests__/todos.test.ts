import request from 'supertest';
import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express, { Request } from 'express';
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

// Request型を拡張
interface AuthRequest extends Request {
  userId: string;
}

// テスト用アプリケーション作成（実際のデータベース接続）
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  const prisma = new PrismaClient();
  
  // 認証ミドルウェア
  const authMiddleware = async (req: AuthRequest, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as any;
      req.userId = decoded.userId;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
  
  // TODO APIルート
  app.post('/api/todos', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { title, description, priority, status, groupId } = req.body;
      
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      // グループの存在確認
      let targetGroupId = groupId;
      if (!targetGroupId) {
        // デフォルトグループを取得
        const userGroup = await prisma.groupMember.findFirst({
          where: {
            userId: req.userId,
            role: 'OWNER'
          },
          include: { group: true }
        });
        
        if (!userGroup) {
          return res.status(400).json({ error: 'No default group found' });
        }
        
        targetGroupId = userGroup.groupId;
      }
      
      // グループメンバーシップを確認
      const membership = await prisma.groupMember.findFirst({
        where: {
          userId: req.userId,
          groupId: targetGroupId
        }
      });
      
      if (!membership) {
        return res.status(403).json({ error: 'Access denied to this group' });
      }
      
      const todo = await prisma.todo.create({
        data: {
          title,
          description: description || null,
          priority: priority || 'MEDIUM',
          status: status || 'PENDING',
          createdBy: req.userId,
          groupId: targetGroupId
        }
      });
      
      res.status(201).json({ todo });
    } catch (error) {
      console.error('Create todo error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/api/todos', authMiddleware, async (req: AuthRequest, res) => {
    try {
      // ユーザーがメンバーであるグループを取得
      const userGroups = await prisma.groupMember.findMany({
        where: { userId: req.userId },
        select: { groupId: true }
      });
      
      const groupIds = userGroups.map(gm => gm.groupId);
      
      const todos = await prisma.todo.findMany({
        where: {
          groupId: { in: groupIds }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.status(200).json({ todos });
    } catch (error) {
      console.error('Get todos error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.put('/api/todos/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { title, description, priority, status, assignedTo } = req.body;
      
      // TODOの存在確認とアクセス権限チェック
      const existingTodo = await prisma.todo.findUnique({
        where: { id },
        include: {
          group: {
            include: {
              members: {
                where: { userId: req.userId }
              }
            }
          }
        }
      });
      
      if (!existingTodo) {
        return res.status(404).json({ error: 'Todo not found' });
      }
      
      if (existingTodo.group.members.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const updatedTodo = await prisma.todo.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(priority && { priority }),
          ...(status && { status }),
          ...(assignedTo && { assignedTo })
        }
      });
      
      res.status(200).json({ todo: updatedTodo });
    } catch (error) {
      console.error('Update todo error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.delete('/api/todos/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // TODOの存在確認とアクセス権限チェック
      const existingTodo = await prisma.todo.findUnique({
        where: { id },
        include: {
          group: {
            include: {
              members: {
                where: { userId: req.userId }
              }
            }
          }
        }
      });
      
      if (!existingTodo) {
        return res.status(404).json({ error: 'Todo not found' });
      }
      
      if (existingTodo.group.members.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      await prisma.todo.delete({
        where: { id }
      });
      
      res.status(200).json({ message: 'Todo deleted successfully' });
    } catch (error) {
      console.error('Delete todo error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  return app;
};

describe('TODO API テスト（DB接続版）', () => {
  let app: express.Application;
  let prisma: PrismaClient;
  let testUser: any;
  let testToken: string;

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

    // テスト用ユーザーを作成
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User'
      }
    });

    // デフォルトグループを作成
    const group = await prisma.group.create({
      data: {
        name: 'Test Group',
        description: 'Test Description',
        createdBy: testUser.id
      }
    });

    // ユーザーをグループのオーナーとして追加
    await prisma.groupMember.create({
      data: {
        userId: testUser.id,
        groupId: group.id,
        role: 'OWNER'
      }
    });

    // テスト用トークンを生成
    testToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  describe('POST /api/todos', () => {
    it('新しいTODOを作成できる', async () => {
      const todoData = {
        title: 'テストTODO',
        description: 'これはテスト用のTODOです',
        priority: 'HIGH',
        status: 'PENDING'
      };

      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${testToken}`)
        .send(todoData)
        .expect(201);

      expect(response.body.todo).toHaveProperty('title', todoData.title);
      expect(response.body.todo).toHaveProperty('description', todoData.description);
      expect(response.body.todo).toHaveProperty('priority', todoData.priority);
      expect(response.body.todo).toHaveProperty('status', todoData.status);
      expect(response.body.todo).toHaveProperty('createdBy', testUser.id);

      // データベースにTODOが作成されていることを確認
      const createdTodo = await prisma.todo.findFirst({
        where: { title: todoData.title }
      });
      expect(createdTodo).not.toBeNull();
      expect(createdTodo?.priority).toBe('HIGH');
    });

    it('認証なしでTODOを作成しようとするとエラーになる', async () => {
      const todoData = {
        title: 'テストTODO',
        description: 'これはテスト用のTODOです'
      };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('タイトルが空の場合エラーになる', async () => {
      const todoData = {
        title: '',
        description: 'これはテスト用のTODOです'
      };

      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${testToken}`)
        .send(todoData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Title is required');
    });

    it('タイトルが未定義の場合エラーになる', async () => {
      const todoData = {
        description: 'これはテスト用のTODOです'
      };

      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${testToken}`)
        .send(todoData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Title is required');
    });
  });

  describe('GET /api/todos', () => {
    it('TODOリストを取得できる', async () => {
      // まずTODOを作成
      const todo = await prisma.todo.create({
        data: {
          title: 'テストTODO',
          description: 'テスト説明',
          priority: 'MEDIUM',
          status: 'PENDING',
          createdBy: testUser.id,
          groupId: (await prisma.group.findFirst({ where: { createdBy: testUser.id } }))!.id
        }
      });

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.todos).toHaveLength(1);
      expect(response.body.todos[0]).toHaveProperty('title', 'テストTODO');
      expect(response.body.todos[0]).toHaveProperty('createdBy', testUser.id);
    });

    it('認証なしでTODOリストを取得しようとするとエラーになる', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('TODOを正常に更新できる', async () => {
      // まずTODOを作成
      const group = await prisma.group.findFirst({ where: { createdBy: testUser.id } });
      const todo = await prisma.todo.create({
        data: {
          title: 'テストTODO',
          description: 'テスト説明',
          priority: 'MEDIUM',
          status: 'PENDING',
          createdBy: testUser.id,
          groupId: group!.id
        }
      });

      const updateData = {
        title: '更新後のTODO',
        description: '更新後の説明',
        status: 'COMPLETED'
      };

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.todo).toHaveProperty('title', updateData.title);
      expect(response.body.todo).toHaveProperty('description', updateData.description);
      expect(response.body.todo).toHaveProperty('status', 'COMPLETED');
    });

    it('存在しないTODOを更新しようとするとエラーになる', async () => {
      const response = await request(app)
        .put('/api/todos/nonexistent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: '更新タイトル'
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Todo not found');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('TODOを正常に削除できる', async () => {
      // まずTODOを作成
      const group = await prisma.group.findFirst({ where: { createdBy: testUser.id } });
      const todo = await prisma.todo.create({
        data: {
          title: 'テストTODO',
          description: 'テスト説明',
          priority: 'MEDIUM',
          status: 'PENDING',
          createdBy: testUser.id,
          groupId: group!.id
        }
      });

      const response = await request(app)
        .delete(`/api/todos/${todo.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Todo deleted successfully');

      // データベースからTODOが削除されていることを確認
      const deletedTodo = await prisma.todo.findUnique({
        where: { id: todo.id }
      });
      expect(deletedTodo).toBeNull();
    });

    it('存在しないTODOを削除しようとするとエラーになる', async () => {
      const response = await request(app)
        .delete('/api/todos/nonexistent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Todo not found');
    });
  });
});
