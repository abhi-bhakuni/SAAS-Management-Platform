import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateOrganizationInvites1712311200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create organization_invites table
    await queryRunner.createTable(
      new Table({
        name: 'organization_invites',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organizationId',
            type: 'uuid',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'inviteToken',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            default: "'member'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'PENDING'",
          },
          {
            name: 'invitedByUserId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'acceptedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'createdAt',
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

    // Create foreign key to organizations
    await queryRunner.createForeignKey(
      'organization_invites',
      new TableForeignKey({
        columnNames: ['organizationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key to users (invited by)
    await queryRunner.createForeignKey(
      'organization_invites',
      new TableForeignKey({
        columnNames: ['invitedByUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'organization_invites',
      new TableIndex({
        columnNames: ['email', 'organizationId'],
      }),
    );

    await queryRunner.createIndex(
      'organization_invites',
      new TableIndex({
        columnNames: ['inviteToken'],
      }),
    );

    await queryRunner.createIndex(
      'organization_invites',
      new TableIndex({
        columnNames: ['organizationId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'organization_invites',
      new TableIndex({
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('organization_invites', 'IDX_organization_invites_email_organizationId');
    await queryRunner.dropIndex('organization_invites', 'IDX_organization_invites_inviteToken');
    await queryRunner.dropIndex('organization_invites', 'IDX_organization_invites_organizationId_status');
    await queryRunner.dropIndex('organization_invites', 'IDX_organization_invites_status');

    // Drop foreign keys
    const table = await queryRunner.getTable('organization_invites');

    if (table) {
      const fkOrganization = table.foreignKeys.find((fk) => fk.columnNames.indexOf('organizationId') !== -1);
      const fkUser = table.foreignKeys.find((fk) => fk.columnNames.indexOf('invitedByUserId') !== -1);

      if (fkOrganization) {
        await queryRunner.dropForeignKey('organization_invites', fkOrganization);
      }

      if (fkUser) {
        await queryRunner.dropForeignKey('organization_invites', fkUser);
      }
    }

    // Drop table
    await queryRunner.dropTable('organization_invites', true);
  }
}
