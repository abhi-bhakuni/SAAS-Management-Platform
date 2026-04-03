import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class MigrateToUserOrganizationMemberships1712398800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the user_organization_memberships table
    await queryRunner.createTable(
      new Table({
        name: 'user_organization_memberships',
        columns: [
          {
            name: 'userId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            default: "'MEMBER'",
          },
          {
            name: 'joinedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 2. Create foreign keys
    await queryRunner.createForeignKey(
      'user_organization_memberships',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_organization_memberships',
      new TableForeignKey({
        columnNames: ['organizationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    // 3. Create indexes
    await queryRunner.createIndex(
      'user_organization_memberships',
      new TableIndex({
        name: 'IDX_user_org_memberships_org_role',
        columnNames: ['organizationId', 'role'],
      }),
    );

    await queryRunner.createIndex(
      'user_organization_memberships',
      new TableIndex({
        name: 'IDX_user_org_memberships_user_org',
        columnNames: ['userId', 'organizationId'],
      }),
    );

    // 4. Migrate data: Copy users with organizationId to memberships table
    await queryRunner.query(`
      INSERT INTO user_organization_memberships (userId, organizationId, role, joinedAt, updatedAt)
      SELECT
        u.id,
        u."organizationId",
        CASE
          WHEN u.role = 'admin' AND NOT EXISTS (
            SELECT 1 FROM user_organization_memberships um
            WHERE um."organizationId" = u."organizationId"
          ) THEN 'OWNER'
          WHEN u.role = 'admin' THEN 'ADMIN'
          ELSE 'MEMBER'
        END as role,
        COALESCE(u."createdAt", CURRENT_TIMESTAMP),
        COALESCE(u."updatedAt", CURRENT_TIMESTAMP)
      FROM users u
      WHERE u."organizationId" IS NOT NULL;
    `);

    // 5. Drop the foreign key on users.organizationId
    const userTable = await queryRunner.getTable('users');
    if (userTable) {
      const organizationForeignKey = userTable.foreignKeys.find(
        (fk) => fk.columnNames.includes('organizationId'),
      );

      if (organizationForeignKey) {
        await queryRunner.dropForeignKey('users', organizationForeignKey);
      }
    }

    // 6. Drop the organizationId index
    await queryRunner.dropIndex('users', 'IDX_organizationId');

    // 7. Drop the organizationId column
    await queryRunner.dropColumn('users', 'organizationId');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Add organizationId column back to users
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN "organizationId" uuid;
    `);

    // 2. Create index on organizationId
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_organizationId',
        columnNames: ['organizationId'],
      }),
    );

    // 3. Restore data from memberships to users
    await queryRunner.query(`
      UPDATE users u
      SET "organizationId" = uom."organizationId"
      FROM user_organization_memberships uom
      WHERE u.id = uom."userId"
      AND uom.role IN ('OWNER', 'ADMIN', 'MEMBER');
    `);

    // 4. Create foreign key constraint
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['organizationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    // 5. Drop the memberships table
    await queryRunner.dropTable('user_organization_memberships');
  }
}
