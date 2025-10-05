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
  
  // グループAPIルート
  app.get('/api/groups', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const groups = await prisma.group.findMany({
        where: {
          members: {
            some: {
              userId: req.userId
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });
      
      res.status(200).json({ groups });
    } catch (error) {
      console.error('Get groups error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/api/groups/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const group = await prisma.group.findFirst({
        where: {
          id,
          members: {
            some: {
              userId: req.userId
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });
      
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      res.status(200).json({ group });
    } catch (error) {
      console.error('Get group error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/api/groups', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Group name is required' });
      }
      
      const group = await prisma.group.create({
        data: {
          name,
          description: description || null,
          createdBy: req.userId
        }
      });
      
      // 作成者をオーナーとして追加
      await prisma.groupMember.create({
        data: {
          userId: req.userId,
          groupId: group.id,
          role: 'OWNER'
        }
      });
      
      res.status(201).json({ group });
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.put('/api/groups/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      // グループの存在確認とアクセス権限チェック
      const existingGroup = await prisma.group.findFirst({
        where: {
          id,
          members: {
            some: {
              userId: req.userId,
              role: 'OWNER'
            }
          }
        }
      });
      
      if (!existingGroup) {
        return res.status(404).json({ error: 'Group not found or access denied' });
      }
      
      const updatedGroup = await prisma.group.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description })
        }
      });
      
      res.status(200).json({ group: updatedGroup });
    } catch (error) {
      console.error('Update group error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.delete('/api/groups/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // グループの存在確認とアクセス権限チェック
      const existingGroup = await prisma.group.findFirst({
        where: {
          id,
          members: {
            some: {
              userId: req.userId,
              role: 'OWNER'
            }
          }
        }
      });
      
      if (!existingGroup) {
        return res.status(404).json({ error: 'Group not found or access denied' });
      }
      
      // グループに関連するTODOを削除
      await prisma.todo.deleteMany({
        where: { groupId: id }
      });
      
      // グループメンバーを削除
      await prisma.groupMember.deleteMany({
        where: { groupId: id }
      });
      
      // グループを削除
      await prisma.group.delete({
        where: { id }
      });
      
      res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
      console.error('Delete group error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/api/groups/:id/invite', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { email, role = 'MEMBER' } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // グループの存在確認とアクセス権限チェック
      const group = await prisma.group.findFirst({
        where: {
          id,
          members: {
            some: {
              userId: req.userId,
              role: { in: ['OWNER', 'ADMIN'] }
            }
          }
        }
      });
      
      if (!group) {
        return res.status(404).json({ error: 'Group not found or access denied' });
      }
      
      // 招待するユーザーを検索
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // 既にメンバーかチェック
      const existingMember = await prisma.groupMember.findFirst({
        where: {
          userId: user.id,
          groupId: id
        }
      });
      
      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member' });
      }
      
      // メンバーを追加
      const membership = await prisma.groupMember.create({
        data: {
          userId: user.id,
          groupId: id,
          role: role as 'MEMBER' | 'ADMIN'
        }
      });
      
      res.status(201).json({ 
        message: 'User invited successfully',
        membership 
      });
    } catch (error) {
      console.error('Invite user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.delete('/api/groups/:id/members/:memberId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id, memberId } = req.params;
      
      // グループの存在確認とアクセス権限チェック
      const group = await prisma.group.findFirst({
        where: {
          id,
          members: {
            some: {
              userId: req.userId,
              role: { in: ['OWNER', 'ADMIN'] }
            }
          }
        }
      });
      
      if (!group) {
        return res.status(404).json({ error: 'Group not found or access denied' });
      }
      
      // メンバーシップの存在確認
      const membership = await prisma.groupMember.findFirst({
        where: {
          userId: memberId,
          groupId: id
        }
      });
      
      if (!membership) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      // オーナーは自分自身を削除できない
      if (membership.role === 'OWNER' && memberId === req.userId) {
        return res.status(400).json({ error: 'Owner cannot remove themselves' });
      }
      
      // メンバーを削除
      await prisma.groupMember.delete({
        where: { id: membership.id }
      });
      
      res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  return app;
};

d('グループAPI テスト（DB接続版）', () => {
  let app: express.Application;
  let prisma: PrismaClient;
  let testUser: any;
  let testUser2: any;
  let testToken: string;
  let testToken2: string;

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

    testUser2 = await prisma.user.create({
      data: {
        email: 'test2@example.com',
        password: hashedPassword,
        name: 'Test User 2'
      }
    });

    // テスト用トークンを生成
    testToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    testToken2 = jwt.sign(
      { userId: testUser2.id, email: testUser2.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  describe('POST /api/groups', () => {
    it('新しいグループを作成できる', async () => {
      const groupData = {
        name: 'テストグループ',
        description: 'テスト用のグループです'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${testToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.group).toHaveProperty('name', groupData.name);
      expect(response.body.group).toHaveProperty('description', groupData.description);
      expect(response.body.group).toHaveProperty('createdBy', testUser.id);

      // データベースにグループが作成されていることを確認
      const createdGroup = await prisma.group.findFirst({
        where: { name: groupData.name }
      });
      expect(createdGroup).not.toBeNull();

      // 作成者がオーナーとして追加されていることを確認
      const membership = await prisma.groupMember.findFirst({
        where: {
          userId: testUser.id,
          groupId: createdGroup!.id,
          role: 'OWNER'
        }
      });
      expect(membership).not.toBeNull();
    });

    it('認証なしでグループを作成しようとするとエラーになる', async () => {
      const groupData = {
        name: 'テストグループ',
        description: 'テスト用のグループです'
      };

      const response = await request(app)
        .post('/api/groups')
        .send(groupData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('グループ名が空の場合エラーになる', async () => {
      const groupData = {
        name: '',
        description: 'テスト用のグループです'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${testToken}`)
        .send(groupData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Group name is required');
    });
  });

  describe('GET /api/groups', () => {
    it('ユーザーが所属するグループリストを取得できる', async () => {
      // グループを作成
      const group = await prisma.group.create({
        data: {
          name: 'テストグループ',
          description: 'テスト用のグループです',
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

      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.groups).toHaveLength(1);
      expect(response.body.groups[0]).toHaveProperty('name', 'テストグループ');
      expect(response.body.groups[0]).toHaveProperty('members');
      expect(response.body.groups[0].members).toHaveLength(1);
    });

    it('認証なしでグループリストを取得しようとするとエラーになる', async () => {
      const response = await request(app)
        .get('/api/groups')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('GET /api/groups/:id', () => {
    it('特定のグループの詳細を取得できる', async () => {
      // グループを作成
      const group = await prisma.group.create({
        data: {
          name: 'テストグループ',
          description: 'テスト用のグループです',
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

      const response = await request(app)
        .get(`/api/groups/${group.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.group).toHaveProperty('name', 'テストグループ');
      expect(response.body.group).toHaveProperty('members');
      expect(response.body.group.members).toHaveLength(1);
    });

    it('存在しないグループを取得しようとするとエラーになる', async () => {
      const response = await request(app)
        .get('/api/groups/nonexistent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Group not found');
    });
  });

  describe('POST /api/groups/:id/invite', () => {
    it('ユーザーをグループに招待できる', async () => {
      // グループを作成
      const group = await prisma.group.create({
        data: {
          name: 'テストグループ',
          description: 'テスト用のグループです',
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

      const response = await request(app)
        .post(`/api/groups/${group.id}/invite`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          email: testUser2.email,
          role: 'MEMBER'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User invited successfully');
      expect(response.body).toHaveProperty('membership');

      // データベースにメンバーシップが作成されていることを確認
      const membership = await prisma.groupMember.findFirst({
        where: {
          userId: testUser2.id,
          groupId: group.id
        }
      });
      expect(membership).not.toBeNull();
      expect(membership?.role).toBe('MEMBER');
    });

    it('存在しないユーザーを招待しようとするとエラーになる', async () => {
      // グループを作成
      const group = await prisma.group.create({
        data: {
          name: 'テストグループ',
          description: 'テスト用のグループです',
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

      const response = await request(app)
        .post(`/api/groups/${group.id}/invite`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          email: 'nonexistent@example.com',
          role: 'MEMBER'
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('オーナーはグループを削除できる', async () => {
      // グループを作成
      const group = await prisma.group.create({
        data: {
          name: 'テストグループ',
          description: 'テスト用のグループです',
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

      const response = await request(app)
        .delete(`/api/groups/${group.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Group deleted successfully');

      // データベースからグループが削除されていることを確認
      const deletedGroup = await prisma.group.findUnique({
        where: { id: group.id }
      });
      expect(deletedGroup).toBeNull();
    });

    it('メンバーはグループを削除できない', async () => {
      // グループを作成
      const group = await prisma.group.create({
        data: {
          name: 'テストグループ',
          description: 'テスト用のグループです',
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

      // ユーザー2をグループのメンバーとして追加
      await prisma.groupMember.create({
        data: {
          userId: testUser2.id,
          groupId: group.id,
          role: 'MEMBER'
        }
      });

      const response = await request(app)
        .delete(`/api/groups/${group.id}`)
        .set('Authorization', `Bearer ${testToken2}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Group not found or access denied');
    });
  });
});
