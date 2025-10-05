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
    // ユーザーが所属するグループのIDを取得
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

    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// create a todo
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, description, priority, completed, status, groupId, assignedTo } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // デフォルトグループを取得（指定されていない場合）
    let targetGroupId = groupId;
    if (!targetGroupId) {
      const userPersonalGroup = await prisma.groupMember.findFirst({
        where: { 
          userId: req.userId,
          role: 'OWNER'
        },
        select: { groupId: true }
      });
      
      if (!userPersonalGroup) {
        return res.status(400).json({ error: 'No personal group found' });
      }
      
      targetGroupId = userPersonalGroup.groupId;
    }

    // グループのメンバーかどうか確認
    const isGroupMember = await prisma.groupMember.findFirst({
      where: {
        userId: req.userId,
        groupId: targetGroupId
      }
    });

    if (!isGroupMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // statusが指定されている場合はそれを使用、そうでなければcompletedから推測
    let finalStatus = status;
    if (!finalStatus && completed !== undefined) {
      finalStatus = completed ? 'COMPLETED' : 'PENDING';
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        completed: completed || false,
        status: finalStatus || 'PENDING',
        createdBy: req.userId!,
        assignedTo: assignedTo || req.userId!, // デフォルトは作成者
        groupId: targetGroupId
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
    const { title, description, completed, priority, status, assignedTo } = req.body;

    // TODOが存在し、ユーザーが所属するグループのTODOかどうか確認
    const existingTodo = await prisma.todo.findFirst({
      where: { 
        id,
        group: {
          members: {
            some: {
              userId: req.userId
            }
          }
        }
      }
    });

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // statusが指定されている場合はそれを使用、そうでなければcompletedから推測
    let finalStatus = status;
    if (!finalStatus && completed !== undefined) {
      finalStatus = completed ? 'COMPLETED' : 'PENDING';
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTodo.title,
        description: description !== undefined ? description : existingTodo.description,
        completed: completed !== undefined ? completed : existingTodo.completed,
        priority: priority !== undefined ? priority : existingTodo.priority || 'MEDIUM',
        status: finalStatus !== undefined ? finalStatus : existingTodo.status || 'PENDING',
        assignedTo: assignedTo !== undefined ? assignedTo : existingTodo.assignedTo
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

    // TODOが存在し、ユーザーが所属するグループのTODOかどうか確認
    const existingTodo = await prisma.todo.findFirst({
      where: { 
        id,
        group: {
          members: {
            some: {
              userId: req.userId
            }
          }
        }
      }
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
