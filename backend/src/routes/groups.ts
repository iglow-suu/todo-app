import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ユーザーが所属するグループ一覧を取得
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
        },
        todos: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// 特定のグループの詳細を取得
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // ユーザーがグループのメンバーかチェック
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: userId
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
        },
        todos: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// 新しいグループを作成
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, description, color } = req.body;
    const userId = req.userId!;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        color: color || '#3B82F6',
        createdBy: userId,
        members: {
          create: {
            userId: userId,
            role: 'OWNER'
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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

    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// グループ情報を更新
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    const userId = req.userId!;

    // ユーザーがグループのオーナーまたは管理者かチェック
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: userId,
        role: {
          in: ['OWNER', 'ADMIN']
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const group = await prisma.group.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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

    res.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// グループを削除
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // ユーザーがグループのオーナーかチェック
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: userId,
        role: 'OWNER'
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Only group owner can delete the group' });
    }

    await prisma.group.delete({
      where: { id }
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// メンバーを招待
router.post('/:id/invite', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { email, role = 'MEMBER' } = req.body;
    const userId = req.userId!;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // ユーザーがグループのオーナーまたは管理者かチェック
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: userId,
        role: {
          in: ['OWNER', 'ADMIN']
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 招待されるユーザーを検索
    const invitedUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!invitedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 既にメンバーかチェック
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: invitedUser.id
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    const groupMember = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId: invitedUser.id,
        role: role as 'OWNER' | 'ADMIN' | 'MEMBER'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(groupMember);
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

// メンバーを削除
router.delete('/:id/members/:memberId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.userId!;

    // ユーザーがグループのオーナーまたは管理者かチェック
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: userId,
        role: {
          in: ['OWNER', 'ADMIN']
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 削除対象のメンバーをチェック
    const targetMember = await prisma.groupMember.findFirst({
      where: {
        id: memberId,
        groupId: id
      }
    });

    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // オーナーは削除できない
    if (targetMember.role === 'OWNER') {
      return res.status(400).json({ error: 'Cannot remove group owner' });
    }

    await prisma.groupMember.delete({
      where: { id: memberId }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// メンバーの役割を更新
router.put('/:id/members/:memberId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    const userId = req.userId!;

    if (!role || !['OWNER', 'ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // ユーザーがグループのオーナーかチェック
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: userId,
        role: 'OWNER'
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Only group owner can change roles' });
    }

    const groupMember = await prisma.groupMember.update({
      where: { id: memberId },
      data: { role: role as 'OWNER' | 'ADMIN' | 'MEMBER' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(groupMember);
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

export default router;
