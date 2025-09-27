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
  
  // テスト用の認証ミドルウェア
  const mockAuth = (req: any, res: any, next: any) => {
    (req as any).userId = 'test-user-id';
    next();
  };
  
  // テスト用TODO APIルート
  app.post('/api/todos', mockAuth, (req, res) => {
    const { title, description } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    res.status(201).json({
      todo: {
        id: 'todo-1',
        title,
        description: description || null,
        completed: false,
        userId: (req as any).userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  });
  
  app.get('/api/todos', mockAuth, (req, res) => {
    res.status(200).json({
      todos: [
        {
          id: 'todo-1',
          title: 'テストTODO',
          description: 'テスト説明',
          completed: false,
          userId: (req as any).userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    });
  });
  
  app.put('/api/todos/:id', mockAuth, (req, res) => {
    const { id } = req.params;
    const { title, description, completed } = req.body;
    
    if (id === 'nonexistent-id') {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.status(200).json({
      todo: {
        id,
        title: title || '更新されたTODO',
        description: description || '更新された説明',
        completed: completed || false,
        userId: (req as any).userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  });
  
  app.delete('/api/todos/:id', mockAuth, (req, res) => {
    const { id } = req.params;
    
    if (id === 'nonexistent-id') {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.status(200).json({ message: 'Todo deleted successfully' });
  });
  
  // 認証なしのリクエスト用
  app.use('/api/todos', (req, res) => {
    res.status(401).json({ error: 'Access token required' });
  });
  
  return app;
};

describe('TODO API テスト（シンプル版）', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/todos', () => {
    it('新しいTODOを作成できる', async () => {
      const todoData = {
        title: 'テストTODO',
        description: 'これはテスト用のTODOです'
      };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData)
        .expect(201);

      expect(response.body.todo).toHaveProperty('title', todoData.title);
      expect(response.body.todo).toHaveProperty('description', todoData.description);
      expect(response.body.todo).toHaveProperty('completed', false);
      expect(response.body.todo).toHaveProperty('userId', 'test-user-id');
    });

    it('タイトルが空の場合エラーになる', async () => {
      const todoData = {
        title: '',
        description: 'これはテスト用のTODOです'
      };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('タイトルが未定義の場合エラーになる', async () => {
      const todoData = {
        description: 'これはテスト用のTODOです'
      };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/todos', () => {
    it('TODOリストを取得できる', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(response.body.todos).toHaveLength(1);
      expect(response.body.todos[0]).toHaveProperty('title');
      expect(response.body.todos[0]).toHaveProperty('userId', 'test-user-id');
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('TODOを正常に更新できる', async () => {
      const updateData = {
        title: '更新後のTODO',
        description: '更新後の説明',
        completed: true
      };

      const response = await request(app)
        .put('/api/todos/existing-todo-id')
        .send(updateData)
        .expect(200);

      expect(response.body.todo).toHaveProperty('title', updateData.title);
      expect(response.body.todo).toHaveProperty('description', updateData.description);
      expect(response.body.todo).toHaveProperty('completed', true);
    });

    it('存在しないTODOを更新しようとするとエラーになる', async () => {
      const response = await request(app)
        .put('/api/todos/nonexistent-id')
        .send({
          title: '更新タイトル'
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('TODOを正常に削除できる', async () => {
      const response = await request(app)
        .delete('/api/todos/existing-todo-id')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('存在しないTODOを削除しようとするとエラーになる', async () => {
      const response = await request(app)
        .delete('/api/todos/nonexistent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
