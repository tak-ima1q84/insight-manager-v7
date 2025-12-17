import { pgTable, serial, varchar, integer, text, date, decimal, timestamp, json } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'Admin', 'Manager', 'Viewer'
  createdAt: timestamp('created_at').defaultNow(),
});

export const masterOptions = pgTable('master_options', {
  id: serial('id').primaryKey(),
  categoryKey: varchar('category_key', { length: 50 }).notNull(),
  optionValue: varchar('option_value', { length: 100 }).notNull(),
  optionLabel: varchar('option_label', { length: 200 }).notNull(),
  sortOrder: integer('sort_order').default(0),
});

export const insights = pgTable('insights', {
  id: serial('id').primaryKey(),
  creationNumber: integer('creation_number').notNull(),
  subject: varchar('subject', { length: 500 }),
  insightId: varchar('insight_id', { length: 100 }).unique(),
  status: varchar('status', { length: 100 }),
  startDate: date('start_date'),
  updateDate: date('update_date'),
  endDate: date('end_date'),
  type: varchar('type', { length: 100 }),
  mainCategory: varchar('main_category', { length: 100 }),
  subCategory: varchar('sub_category', { length: 100 }),
  dataCategory: varchar('data_category', { length: 100 }),
  targetBanks: json('target_banks').$type<string[]>(),
  logicFormula: text('logic_formula'),
  targetTables: json('target_tables').$type<string[]>(),
  targetUsers: text('target_users'),
  relatedInsight: varchar('related_insight', { length: 200 }),
  revenueCategory: varchar('revenue_category', { length: 100 }),
  iconType: varchar('icon_type', { length: 100 }),
  score: decimal('score', { precision: 5, scale: 2 }),
  relevancePolicy: varchar('relevance_policy', { length: 100 }),
  relevanceScore: varchar('relevance_score', { length: 100 }),
  displayCount: integer('display_count'),
  selectCount: integer('select_count'),
  nextPolicy: varchar('next_policy', { length: 100 }),
  nextValue: varchar('next_value', { length: 200 }),
  appLink: varchar('app_link', { length: 500 }),
  externalLink: varchar('external_link', { length: 500 }),
  teaserImage: varchar('teaser_image', { length: 500 }),
  storyImages: json('story_images').$type<string[]>(),
  maintenanceDate: date('maintenance_date').default('2099-12-31'),
  maintenanceReason: varchar('maintenance_reason', { length: 50 }),
  remarks: varchar('remarks', { length: 200 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
