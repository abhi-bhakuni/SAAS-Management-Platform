import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserRoles1704067200001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update existing role values
    await queryRunner.query(
      "UPDATE users SET role = 'member' WHERE role = 'user'",
    );
    await queryRunner.query(
      "UPDATE users SET role = 'manager' WHERE role = 'viewer'",
    );

    // Add constraint to enforce role values
    await queryRunner.query(
      `ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('admin', 'manager', 'member'))`,
    );

    // Update default role for new inserts
    await queryRunner.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'member'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert constraint
    await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT check_role`);

    // Revert role values
    await queryRunner.query(
      "UPDATE users SET role = 'user' WHERE role = 'member'",
    );
    await queryRunner.query(
      "UPDATE users SET role = 'viewer' WHERE role = 'manager'",
    );

    // Revert default role
    await queryRunner.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'`);
  }
}
