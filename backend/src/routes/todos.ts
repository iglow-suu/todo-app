import express from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// authentication is required for all routes
router.use(authenticateToken);

// get all todos
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

// create a todo
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        userId: req.userId!
      }
    });

    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TODO update
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed, priority } = req.body;

    // check if the todo exists and if the user owns it
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
        completed: completed !== undefined ? completed : existingTodo.completed,
        priority: priority !== undefined ? priority : existingTodo.priority || 'MEDIUM'
      }
    });

    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// delete a todo
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // check if the todo exists and if the user owns it
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
