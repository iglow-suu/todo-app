import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function migrateToGroups() {
  console.log('🚀 Starting migration to group-based structure...');

  try {
    // 1. 既存のユーザーを取得
    const users = await prisma.user.findMany({
      include: {
        todos: true // 既存のTODOも含める（もしあれば）
      }
    });

    console.log(`📊 Found ${users.length} users to migrate`);

    for (const user of users) {
      console.log(`👤 Processing user: ${user.email}`);

      // 2. 各ユーザーに個人用デフォルトグループを作成
      const personalGroup = await prisma.group.create({
        data: {
          name: `${user.name || user.email}の個人タスク`,
          description: '個人用のデフォルトグループです',
          color: '#3B82F6',
          createdBy: user.id
        }
      });

      console.log(`✅ Created personal group: ${personalGroup.name}`);

      // 3. グループメンバーとしてユーザーを追加（OWNER権限）
      await prisma.groupMember.create({
        data: {
          userId: user.id,
          groupId: personalGroup.id,
          role: 'OWNER'
        }
      });

      console.log(`👑 Added user as OWNER of personal group`);

      // 4. 既存のTODOがある場合は新しいスキーマに移行
      if (user.todos && user.todos.length > 0) {
        console.log(`📋 Migrating ${user.todos.length} existing todos...`);

        for (const todo of user.todos) {
          // 既存のTODOを削除して新しいスキーマで再作成
          await prisma.todo.delete({
            where: { id: todo.id }
          });

          await prisma.todo.create({
            data: {
              id: todo.id, // 同じIDを保持
              title: todo.title,
              description: todo.description,
              completed: todo.completed,
              status: todo.status,
              priority: todo.priority,
              createdBy: user.id, // 作成者として設定
              assignedTo: user.id, // 自分に割り当て
              groupId: personalGroup.id, // 個人グループに所属
              createdAt: todo.createdAt,
              updatedAt: todo.updatedAt
            }
          });
        }

        console.log(`✅ Migrated ${user.todos.length} todos to new schema`);
      }

      console.log(`🎉 Completed migration for user: ${user.email}\n`);
    }

    console.log('✨ Migration completed successfully!');
    console.log(`📈 Summary:`);
    console.log(`   - ${users.length} users processed`);
    console.log(`   - ${users.length} personal groups created`);
    console.log(`   - ${users.reduce((total, user) => total + (user.todos?.length || 0), 0)} todos migrated`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトを直接実行する場合
if (require.main === module) {
  migrateToGroups()
    .then(() => {
      console.log('🏁 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateToGroups };
