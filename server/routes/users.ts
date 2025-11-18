import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    console.log('📝 Fetching all users...');
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log(`✅ Found ${users.length} users`);
    res.json(users);
  } catch (error: any) {
    console.error('❌ Failed to fetch users:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ 
      error: 'Failed to fetch users', 
      details: error.message,
      code: error.code 
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create user
router.post('/', async (req, res) => {
  try {
    const { id, name, email, role, avatar, isOnline } = req.body;
    
    // If ID is provided, use upsert (create or update)
    if (id) {
      const user = await prisma.user.upsert({
        where: { id },
        update: {
          name: name || undefined,
          email: email || undefined,
          role: role || undefined,
          avatar: avatar !== undefined ? avatar : undefined,
          isOnline: isOnline !== undefined ? isOnline : undefined,
        },
        create: {
          id,
          name,
          email,
          role: role || 'contributor',
          avatar,
          isOnline: isOnline ?? false,
        },
      });
      return res.status(201).json(user);
    }
    
    // Otherwise, create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role || 'contributor',
        avatar,
        isOnline: isOnline ?? false,
      },
    });
    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, avatar, isOnline } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(avatar !== undefined && { avatar }),
        ...(isOnline !== undefined && { isOnline }),
      },
    });
    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export { router as usersRouter };

