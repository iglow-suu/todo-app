import express from 'express';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 全てのルートで認証が必要
router.use(authenticateToken);

// TODO一覧取得
router.get('/', async (req: AuthRequest, res) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TODO作成
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description: description || null,
        userId: req.userId!
      }
    });

    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TODO更新
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    // TODOの存在確認と所有者確認
    const existingTodo = await prisma.todo.findFirst({
      where: { id, userId: req.userId }
    });

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTodo.title,
        description: description !== undefined ? description : existingTodo.description,
        completed: completed !== undefined ? completed : existingTodo.completed
      }
    });

    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TODO削除
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // TODOの存在確認と所有者確認
    const existingTodo = await prisma.todo.findFirst({
      where: { id, userId: req.userId }
    });

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await prisma.todo.delete({
      where: { id }
    });

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
