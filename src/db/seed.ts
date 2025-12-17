import { db } from './index';
import { masterOptions, users } from './schema';
import { eq } from 'drizzle-orm';

const masterData = [
  // d1. Insight Display Status
  { categoryKey: 'status', optionValue: '01_Waiting for Test', optionLabel: '01_テスト待ち', sortOrder: 1 },
  { categoryKey: 'status', optionValue: '02_Testing', optionLabel: '02_テスト中', sortOrder: 2 },
  { categoryKey: 'status', optionValue: '03_Waiting for Distribution', optionLabel: '03_配信待ち', sortOrder: 3 },
  { categoryKey: 'status', optionValue: '04_Distributing', optionLabel: '04_配信中', sortOrder: 4 },
  { categoryKey: 'status', optionValue: '05_Suspended', optionLabel: '05_停止中', sortOrder: 5 },
  { categoryKey: 'status', optionValue: '06_Distribution Ended', optionLabel: '06_配信終了', sortOrder: 6 },
  { categoryKey: 'status', optionValue: '07_Withdrawn', optionLabel: '07_取り下げ', sortOrder: 7 },
  { categoryKey: 'status', optionValue: '08_Deleted', optionLabel: '08_削除', sortOrder: 8 },

  // h1. Insight Type
  { categoryKey: 'insight_type', optionValue: 'base', optionLabel: 'base', sortOrder: 1 },
  { categoryKey: 'insight_type', optionValue: 'custom', optionLabel: 'custom', sortOrder: 2 },
  { categoryKey: 'insight_type', optionValue: 'obb', optionLabel: 'obb', sortOrder: 3 },
  { categoryKey: 'insight_type', optionValue: 'Other', optionLabel: 'その他（備考欄に記入）', sortOrder: 4 },

  // i1. Main Category
  { categoryKey: 'main_category', optionValue: 'base', optionLabel: 'base', sortOrder: 1 },
  { categoryKey: 'main_category', optionValue: 'obb', optionLabel: 'obb', sortOrder: 2 },
  { categoryKey: 'main_category', optionValue: 'tips', optionLabel: 'tips', sortOrder: 3 },
  { categoryKey: 'main_category', optionValue: 'notification', optionLabel: 'notification', sortOrder: 4 },
  { categoryKey: 'main_category', optionValue: 'marketing', optionLabel: 'marketing', sortOrder: 5 },
  { categoryKey: 'main_category', optionValue: 'event', optionLabel: 'event', sortOrder: 6 },
  { categoryKey: 'main_category', optionValue: 'quiz', optionLabel: 'quiz', sortOrder: 7 },
  { categoryKey: 'main_category', optionValue: 'game', optionLabel: 'game', sortOrder: 8 },
  { categoryKey: 'main_category', optionValue: 'Other', optionLabel: 'その他（備考欄に記入）', sortOrder: 9 },

  // k1. Data Category
  { categoryKey: 'data_category', optionValue: 'Financial Only', optionLabel: '金融データのみ', sortOrder: 1 },
  { categoryKey: 'data_category', optionValue: 'Non-Financial Only', optionLabel: '非金融データのみ', sortOrder: 2 },
  { categoryKey: 'data_category', optionValue: 'Financial/Non-Financial Data', optionLabel: '金融/非金融データ', sortOrder: 3 },
  { categoryKey: 'data_category', optionValue: 'No Data', optionLabel: 'データなし', sortOrder: 4 },

  // l1. Financial Data Usage Banks
  { categoryKey: 'target_banks', optionValue: 'None', optionLabel: 'なし', sortOrder: 1 },
  { categoryKey: 'target_banks', optionValue: 'Fukuoka', optionLabel: '福岡', sortOrder: 2 },
  { categoryKey: 'target_banks', optionValue: 'Juhachi-Shinwa', optionLabel: '十八親和', sortOrder: 3 },
  { categoryKey: 'target_banks', optionValue: 'Kumamoto', optionLabel: '熊本', sortOrder: 4 },
  { categoryKey: 'target_banks', optionValue: 'Awa', optionLabel: '阿波', sortOrder: 5 },
  { categoryKey: 'target_banks', optionValue: 'Okinawa', optionLabel: '沖縄', sortOrder: 6 },
  { categoryKey: 'target_banks', optionValue: 'Kitanippon', optionLabel: '北日本', sortOrder: 7 },
  { categoryKey: 'target_banks', optionValue: 'Saga', optionLabel: '佐賀', sortOrder: 8 },
  { categoryKey: 'target_banks', optionValue: 'Hachijuni-Nagano', optionLabel: '八十二長野', sortOrder: 9 },
  { categoryKey: 'target_banks', optionValue: 'Hiroshima', optionLabel: '広島', sortOrder: 10 },
  { categoryKey: 'target_banks', optionValue: 'Yamanashi Chuo', optionLabel: '山梨中央', sortOrder: 11 },
  { categoryKey: 'target_banks', optionValue: 'Shizuoka', optionLabel: '静岡', sortOrder: 12 },
  { categoryKey: 'target_banks', optionValue: 'Other', optionLabel: 'その他（備考欄に記入）', sortOrder: 13 },

  // m1-2. Usage Data Tables
  { categoryKey: 'target_tables', optionValue: 'Customers', optionLabel: 'Customers', sortOrder: 1 },
  { categoryKey: 'target_tables', optionValue: 'CustomerAccountRelations', optionLabel: 'CustomerAccountRelations', sortOrder: 2 },
  { categoryKey: 'target_tables', optionValue: 'Accounts', optionLabel: 'Accounts', sortOrder: 3 },
  { categoryKey: 'target_tables', optionValue: 'Cards', optionLabel: 'Cards', sortOrder: 4 },
  { categoryKey: 'target_tables', optionValue: 'Transactions', optionLabel: 'Transactions', sortOrder: 5 },
  { categoryKey: 'target_tables', optionValue: 'ApplicationUsers', optionLabel: 'ApplicationUsers', sortOrder: 6 },
  { categoryKey: 'target_tables', optionValue: 'ApplicationLogs', optionLabel: 'ApplicationLogs', sortOrder: 7 },
  { categoryKey: 'target_tables', optionValue: 'GoalDeposit', optionLabel: 'GoalDeposit', sortOrder: 8 },
  { categoryKey: 'target_tables', optionValue: 'MycoinHistories', optionLabel: 'MycoinHistories', sortOrder: 9 },
  { categoryKey: 'target_tables', optionValue: 'NotificationInfo', optionLabel: 'NotificationInfo', sortOrder: 10 },

  // p1. Revenue Category
  { categoryKey: 'revenue_category', optionValue: 'saving_accounts', optionLabel: 'saving_accounts', sortOrder: 1 },
  { categoryKey: 'revenue_category', optionValue: 'cardloan_application', optionLabel: 'cardloan_application', sortOrder: 2 },
  { categoryKey: 'revenue_category', optionValue: 'cardloan_borrowing', optionLabel: 'cardloan_borrowing', sortOrder: 3 },
  { categoryKey: 'revenue_category', optionValue: 'theo_deposit', optionLabel: 'theo_deposit', sortOrder: 4 },
  { categoryKey: 'revenue_category', optionValue: 'theo_application', optionLabel: 'theo_application', sortOrder: 5 },
  { categoryKey: 'revenue_category', optionValue: 'provisioning', optionLabel: 'provisioning', sortOrder: 6 },
  { categoryKey: 'revenue_category', optionValue: 'cotra', optionLabel: 'cotra', sortOrder: 7 },
  { categoryKey: 'revenue_category', optionValue: 'vdebit_application', optionLabel: 'vdebit_application', sortOrder: 8 },
  { categoryKey: 'revenue_category', optionValue: 'Other', optionLabel: 'その他（備考欄に記入）', sortOrder: 9 },

  // q1. Icon Type
  { categoryKey: 'icon_type', optionValue: 'alert', optionLabel: 'alert', sortOrder: 1 },
  { categoryKey: 'icon_type', optionValue: 'info', optionLabel: 'info', sortOrder: 2 },
  { categoryKey: 'icon_type', optionValue: 'quiz', optionLabel: 'quiz', sortOrder: 3 },
  { categoryKey: 'icon_type', optionValue: 'benefit', optionLabel: 'benefit', sortOrder: 4 },
  { categoryKey: 'icon_type', optionValue: 'stat', optionLabel: 'stat', sortOrder: 5 },
  { categoryKey: 'icon_type', optionValue: 'know', optionLabel: 'know', sortOrder: 6 },
  { categoryKey: 'icon_type', optionValue: 'tx', optionLabel: 'tx', sortOrder: 7 },
  { categoryKey: 'icon_type', optionValue: 'use', optionLabel: 'use', sortOrder: 8 },
  { categoryKey: 'icon_type', optionValue: 'rec', optionLabel: 'rec', sortOrder: 9 },
  { categoryKey: 'icon_type', optionValue: 'other', optionLabel: 'other', sortOrder: 10 },

  // s1. Relevance Policy Type
  { categoryKey: 'relevance_policy', optionValue: 'Always_relevant', optionLabel: 'Always_relevant', sortOrder: 1 },
  { categoryKey: 'relevance_policy', optionValue: 'Calender_period', optionLabel: 'Calender_period', sortOrder: 2 },
  { categoryKey: 'relevance_policy', optionValue: 'Current_run', optionLabel: 'Current_run', sortOrder: 3 },
  { categoryKey: 'relevance_policy', optionValue: 'Day_after_insight_presented', optionLabel: 'Day_after_insight_presented', sortOrder: 4 },
  { categoryKey: 'relevance_policy', optionValue: 'Days_after_relevant_event', optionLabel: 'Days_after_relevant_event', sortOrder: 5 },
  { categoryKey: 'relevance_policy', optionValue: 'other', optionLabel: 'other', sortOrder: 6 },

  // w1. Next Display Policy
  { categoryKey: 'next_policy', optionValue: 'Calender_period', optionLabel: 'Calender_period', sortOrder: 1 },
  { categoryKey: 'next_policy', optionValue: 'Conditional_min_duration', optionLabel: 'Conditional_min_duration', sortOrder: 2 },
  { categoryKey: 'next_policy', optionValue: 'Min_days_duration', optionLabel: 'Min_days_duration', sortOrder: 3 },
  { categoryKey: 'next_policy', optionValue: 'Never', optionLabel: 'Never', sortOrder: 4 },
  { categoryKey: 'next_policy', optionValue: 'No_limitation', optionLabel: 'No_limitation', sortOrder: 5 },
  { categoryKey: 'next_policy', optionValue: 'other', optionLabel: 'other', sortOrder: 6 },
];

async function seed() {
  console.log('Seeding database...');

  try {
    // Insert master options (skip if already exist)
    const existingMasters = await db.select().from(masterOptions).limit(1);
    if (existingMasters.length === 0) {
      await db.insert(masterOptions).values(masterData);
      console.log('Master options inserted');
    } else {
      console.log('Master options already exist, skipping...');
    }
  } catch (error) {
    console.log('Master options may already exist, continuing...');
  }

  // Create default users
  const defaultUsers = [
    { username: 'admin', password: 'admin123', role: 'Admin' },
    { username: 'manager', password: 'manager123', role: 'Manager' },
    { username: 'viewer', password: 'viewer123', role: 'Viewer' },
  ];

  for (const user of defaultUsers) {
    try {
      const existing = await db.select().from(users).where(eq(users.username, user.username)).limit(1);
      if (existing.length === 0) {
        await db.insert(users).values({
          username: user.username,
          passwordHash: await Bun.password.hash(user.password),
          role: user.role,
        });
        console.log(`${user.role} user created (username: ${user.username}, password: ${user.password})`);
      } else {
        console.log(`${user.role} user already exists, skipping...`);
      }
    } catch (error) {
      console.log(`${user.role} user may already exist, continuing...`);
    }
  }

  console.log('Seeding completed!');
}

seed().catch(console.error);
