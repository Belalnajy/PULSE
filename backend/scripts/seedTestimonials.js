const { db } = require('../src/db');
require('dotenv').config();

async function seed() {
  try {
    const existing = await db('testimonials').count('id as count').first();
    if (existing.count > 0) {
      console.log('Testimonials already exist.');
      process.exit(0);
    }

    await db('testimonials').insert({
      name: 'Sarah J.',
      title: 'Marketing Manager',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      rating: 5,
      content:
        'Pulse transformed our content strategy. We generate campaigns in minutes!',
      is_visible: true,
      is_approved: true,
      order: 1,
    });

    console.log('Sample testimonial inserted.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

seed();
