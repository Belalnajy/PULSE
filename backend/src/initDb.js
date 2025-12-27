const { db } = require('./db');

async function ensure(table, builder) {
  const exists = await db.schema.hasTable(table);
  if (!exists) await builder(db.schema);
}

async function initDb() {
  await ensure('users', (s) =>
    s.createTable('users', (t) => {
      t.increments('id').primary();
      t.string('email').notNullable().unique();
      t.string('password_hash').notNullable();
      t.boolean('is_admin').notNullable().defaultTo(false);
      t.string('phone').nullable();
      t.string('display_name').nullable();
      t.boolean('is_verified').notNullable().defaultTo(false);
      t.boolean('has_used_trial').notNullable().defaultTo(false);
      t.string('otp_code').nullable();
      t.datetime('otp_expires_at').nullable();
      t.integer('chat_daily_count').notNullable().defaultTo(0);
      t.integer('assistant_daily_count').notNullable().defaultTo(0);
      t.integer('content_daily_count').notNullable().defaultTo(0);
      t.datetime('usage_last_reset_at').nullable();
      t.datetime('created_at').notNullable().defaultTo(db.fn.now());
    })
  );

  const hasDisplay = await db.schema.hasColumn('users', 'display_name');
  if (!hasDisplay) {
    await db.schema.alterTable('users', (t) => {
      t.string('display_name').nullable();
    });
  }

  const hasPhone = await db.schema.hasColumn('users', 'phone');
  if (!hasPhone) {
    await db.schema.alterTable('users', (t) => {
      t.string('phone').nullable();
    });
  }

  const hasForce = await db.schema.hasColumn('users', 'force_password_change');
  if (!hasForce) {
    await db.schema.alterTable('users', (t) => {
      t.boolean('force_password_change').notNullable().defaultTo(false);
    });
  }

  const hasVerified = await db.schema.hasColumn('users', 'is_verified');
  if (!hasVerified) {
    await db.schema.alterTable('users', (t) => {
      t.boolean('is_verified').notNullable().defaultTo(false);
    });
  }

  const hasOtpCode = await db.schema.hasColumn('users', 'otp_code');
  if (!hasOtpCode) {
    await db.schema.alterTable('users', (t) => {
      t.string('otp_code').nullable();
    });
  }

  const hasOtpExpires = await db.schema.hasColumn('users', 'otp_expires_at');
  if (!hasOtpExpires) {
    await db.schema.alterTable('users', (t) => {
      t.datetime('otp_expires_at').nullable();
    });
  }

  const hasTrialFlag = await db.schema.hasColumn('users', 'has_used_trial');
  if (!hasTrialFlag) {
    await db.schema.alterTable('users', (t) => {
      t.boolean('has_used_trial').notNullable().defaultTo(false);
    });
  }

  const hasResetOtp = await db.schema.hasColumn('users', 'reset_otp');
  if (!hasResetOtp) {
    await db.schema.alterTable('users', (t) => {
      t.string('reset_otp').nullable();
    });
  }

  const hasResetExpires = await db.schema.hasColumn(
    'users',
    'reset_otp_expires_at'
  );
  if (!hasResetExpires) {
    await db.schema.alterTable('users', (t) => {
      t.datetime('reset_otp_expires_at').nullable();
    });
  }

  const hasChatDaily = await db.schema.hasColumn('users', 'chat_daily_count');
  if (!hasChatDaily) {
    await db.schema.alterTable('users', (t) => {
      t.integer('chat_daily_count').notNullable().defaultTo(0);
    });
  }
  const hasAssistantDaily = await db.schema.hasColumn(
    'users',
    'assistant_daily_count'
  );
  if (!hasAssistantDaily) {
    await db.schema.alterTable('users', (t) => {
      t.integer('assistant_daily_count').notNullable().defaultTo(0);
    });
  }
  const hasContentDaily = await db.schema.hasColumn(
    'users',
    'content_daily_count'
  );
  if (!hasContentDaily) {
    await db.schema.alterTable('users', (t) => {
      t.integer('content_daily_count').notNullable().defaultTo(0);
    });
  }
  const hasUsageReset = await db.schema.hasColumn(
    'users',
    'usage_last_reset_at'
  );
  if (!hasUsageReset) {
    await db.schema.alterTable('users', (t) => {
      t.datetime('usage_last_reset_at').nullable();
    });
  }

  // Legacy license/api_keys tables removed from creation to align with subscription model.

  await ensure('conversations', (s) =>
    s.createTable('conversations', (t) => {
      t.increments('id').primary();
      t.integer('user_id')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      t.string('title').notNullable();
      t.datetime('created_at').notNullable().defaultTo(db.fn.now());
    })
  );

  await ensure('messages', (s) =>
    s.createTable('messages', (t) => {
      t.increments('id').primary();
      t.integer('conversation_id')
        .notNullable()
        .references('conversations.id')
        .onDelete('CASCADE');
      t.string('role').notNullable();
      t.text('content').notNullable();
      t.datetime('created_at').notNullable().defaultTo(db.fn.now());
    })
  );

  await ensure('campaigns', (s) =>
    s.createTable('campaigns', (t) => {
      t.increments('id').primary();
      t.integer('user_id')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      t.text('form_inputs_json').notNullable();
      t.text('generated_outputs_json').nullable();
      t.datetime('created_at').notNullable().defaultTo(db.fn.now());
    })
  );

  // Legacy renewal tokens removed.

  await ensure('support_requests', (s) =>
    s.createTable('support_requests', (t) => {
      t.increments('id').primary();
      t.integer('user_id')
        .nullable()
        .references('users.id')
        .onDelete('CASCADE');
      t.string('email').nullable();
      t.string('order_id').nullable();
      t.string('phone').nullable();
      t.text('message').notNullable();
      t.boolean('is_new_user').notNullable().defaultTo(false);
      t.boolean('resolved').notNullable().defaultTo(false);
      t.datetime('created_at').notNullable().defaultTo(db.fn.now());
    })
  );

  const hasSupportEmail = await db.schema.hasColumn(
    'support_requests',
    'email'
  );
  const hasSupportNewFlag = await db.schema.hasColumn(
    'support_requests',
    'is_new_user'
  );
  if (!hasSupportEmail || !hasSupportNewFlag) {
    await db.transaction(async (trx) => {
      await trx.schema.createTable('support_requests_tmp', (t) => {
        t.increments('id').primary();
        t.integer('user_id')
          .nullable()
          .references('users.id')
          .onDelete('CASCADE');
        t.string('email').nullable();
        t.string('order_id').nullable();
        t.string('phone').nullable();
        t.text('message').notNullable();
        t.boolean('is_new_user').notNullable().defaultTo(false);
        t.boolean('resolved').notNullable().defaultTo(false);
        t.datetime('created_at').notNullable().defaultTo(trx.fn.now());
      });
      const rows = await trx('support_requests').select('*');
      for (const r of rows) {
        await trx('support_requests_tmp').insert({
          id: r.id,
          user_id: r.user_id || null,
          email: null,
          order_id: r.order_id || null,
          phone: r.phone || null,
          message: r.message,
          is_new_user: false,
          resolved: r.resolved,
          created_at: r.created_at,
        });
      }
      await trx.schema.dropTable('support_requests');
      await trx.schema.renameTable('support_requests_tmp', 'support_requests');
    });
  }

  await ensure('subscriptions', (s) =>
    s.createTable('subscriptions', (t) => {
      t.increments('id').primary();
      t.integer('user_id')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      t.string('status').notNullable().defaultTo('trial');
      t.string('provider').nullable();
      t.string('transaction_id').nullable();
      t.datetime('start_at').nullable();
      t.datetime('end_at').nullable();
      t.datetime('created_at').notNullable().defaultTo(db.fn.now());
    })
  );

  // Per-platform trial usage table removed in favor of daily counters in users.

  // New daily usage table for stable dateKey-based counters
  await ensure('usage_daily', (s) =>
    s.createTable('usage_daily', (t) => {
      t.increments('id').primary();
      t.integer('user_id')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      t.string('date_key').notNullable(); // YYYY-MM-DD (server local date)
      t.integer('chat_used').notNullable().defaultTo(0);
      t.integer('content_used').notNullable().defaultTo(0);
      t.datetime('created_at').notNullable().defaultTo(db.fn.now());
      t.unique(['user_id', 'date_key']);
    })
  );

  // Add last_reminder_sent column to subscriptions for expiry email tracking
  const hasLastReminderSent = await db.schema.hasColumn(
    'subscriptions',
    'last_reminder_sent'
  );
  if (!hasLastReminderSent) {
    await db.schema.alterTable('subscriptions', (t) => {
      t.datetime('last_reminder_sent').nullable();
    });
  }

  await ensure('payments_sessions', (s) =>
    s.createTable('payments_sessions', (t) => {
      t.increments('id').primary();
      t.string('session_id').notNullable().unique();
      t.integer('user_id')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      t.string('plan_id').notNullable();
      t.string('status').notNullable().defaultTo('pending');
      t.string('provider').notNullable().defaultTo('stub');
      t.text('raw_meta_json').nullable();
      t.datetime('created_at').notNullable().defaultTo(db.fn.now());
      t.datetime('updated_at').notNullable().defaultTo(db.fn.now());
    })
  );

  await ensure('subscriber_usage_daily', (s) =>
    s.createTable('subscriber_usage_daily', (t) => {
      t.increments('id').primary();
      t.integer('user_id')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      t.string('date_key').notNullable();
      t.integer('chat_used').notNullable().defaultTo(0);
      t.integer('content_used').notNullable().defaultTo(0);
      t.datetime('created_at').notNullable().defaultTo(db.fn.now());
      t.unique(['user_id', 'date_key']);
    })
  );

  await ensure('subscription_plans', (s) =>
    s.createTable('subscription_plans', (t) => {
      t.increments('id').primary();
      t.string('plan_id').notNullable().unique();
      t.string('name').notNullable();
      t.integer('price_cents').notNullable();
      t.string('currency').notNullable().defaultTo('USD');
      t.integer('duration_months').notNullable().defaultTo(1);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.text('description').nullable();
      t.datetime('created_at').notNullable().defaultTo(db.fn.now());
      t.datetime('updated_at').notNullable().defaultTo(db.fn.now());
    })
  );

  // Seed default plan if table is empty
  const planCount = await db('subscription_plans').count('* as count').first();
  if (planCount.count === 0) {
    await db('subscription_plans').insert({
      plan_id: 'monthly',
      name: 'الباقة الشاملة',
      price_cents: 5000,
      currency: 'SAR',
      duration_months: 1,
      is_active: true,
      description: 'اشتراك شهري بكامل المميزات',
    });
  }

  await ensure('testimonials', (s) =>
    s.createTable('testimonials', (t) => {
      t.increments('id').primary();
      t.integer('user_id')
        .nullable()
        .references('users.id')
        .onDelete('SET NULL');
      t.string('name').notNullable();
      t.string('title').nullable();
      t.string('avatar').nullable();
      t.integer('rating').notNullable().defaultTo(5);
      t.text('content').notNullable();
      t.boolean('is_visible').notNullable().defaultTo(true);
      t.boolean('is_approved').notNullable().defaultTo(false);
      t.integer('order').notNullable().defaultTo(0);
      t.datetime('created_at').notNullable().defaultTo(db.fn.now());
    })
  );

  const hasTestimonialUserId = await db.schema.hasColumn(
    'testimonials',
    'user_id'
  );
  if (!hasTestimonialUserId) {
    await db.schema.alterTable('testimonials', (t) => {
      t.integer('user_id')
        .nullable()
        .references('users.id')
        .onDelete('SET NULL');
    });
  }
}

module.exports = { initDb };
