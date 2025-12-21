const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { auth } = require('../middleware/auth');

// Middleware to ensure admin
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// GET /public - Fetch visible testimonials
router.get('/public', async (req, res) => {
  try {
    const testimonials = await db('testimonials')
      .where({ is_visible: true, is_approved: true })
      .orderBy('order', 'asc')
      .orderBy('created_at', 'desc');
    res.json({ testimonials });
  } catch (e) {
    console.error('Fetch public testimonials error:', e);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// POST /user - User submits testimonial
router.post('/user', auth, async (req, res) => {
  try {
    const { rating, content } = req.body;
    const userId = req.user.id;

    // Validation
    if (!content || !rating) {
      return res.status(400).json({ error: 'Rating and content are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user already submitted a testimonial
    const existing = await db('testimonials')
      .where({ user_id: userId })
      .first();
    if (existing) {
      return res
        .status(400)
        .json({ error: 'You have already submitted a testimonial' });
    }

    // Get user info
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Insert testimonial
    const [id] = await db('testimonials').insert({
      user_id: userId,
      name: user.name || user.email,
      title: null,
      avatar: null,
      rating,
      content,
      is_visible: true,
      is_approved: false, // Requires admin approval
      order: 0,
    });

    const newTestimonial = await db('testimonials').where({ id }).first();
    res.json({
      testimonial: newTestimonial,
      message: 'Thank you! Your testimonial is pending approval.',
    });
  } catch (e) {
    console.error('Create user testimonial error:', e);
    res.status(500).json({ error: 'Failed to submit testimonial' });
  }
});

// GET / - Admin fetch all
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const testimonials = await db('testimonials')
      .orderBy('order', 'asc')
      .orderBy('created_at', 'desc');
    res.json({ testimonials });
  } catch (e) {
    console.error('Fetch all testimonials error:', e);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// POST / - Create testimonial
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      title,
      avatar,
      rating,
      content,
      is_visible,
      is_approved,
      order,
    } = req.body;

    // Validation
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and Content are required' });
    }

    const [id] = await db('testimonials').insert({
      name,
      title: title || null,
      avatar: avatar || null,
      rating: rating || 5,
      content,
      is_visible: is_visible !== undefined ? is_visible : true,
      is_approved: is_approved !== undefined ? is_approved : true,
      order: order || 0,
    });

    const newTestimonial = await db('testimonials').where({ id }).first();
    res.json({ testimonial: newTestimonial });
  } catch (e) {
    console.error('Create testimonial error:', e);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

// PUT /:id - Update testimonial
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      title,
      avatar,
      rating,
      content,
      is_visible,
      is_approved,
      order,
    } = req.body;

    const existing = await db('testimonials').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    await db('testimonials').where({ id }).update({
      name,
      title,
      avatar,
      rating,
      content,
      is_visible,
      is_approved,
      order,
    });

    const updated = await db('testimonials').where({ id }).first();
    res.json({ testimonial: updated });
  } catch (e) {
    console.error('Update testimonial error:', e);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

// DELETE /:id - Delete testimonial
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('testimonials').where({ id }).del();
    if (!deleted) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.json({ success: true, id });
  } catch (e) {
    console.error('Delete testimonial error:', e);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

// PUT /reorder - Bulk reorder
router.put('/reorder', auth, requireAdmin, async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, order }
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array required' });
    }

    await db.transaction(async (trx) => {
      for (const item of items) {
        await trx('testimonials')
          .where({ id: item.id })
          .update({ order: item.order });
      }
    });

    res.json({ success: true });
  } catch (e) {
    console.error('Reorder error:', e);
    res.status(500).json({ error: 'Failed to reorder testimonials' });
  }
});

module.exports = router;
