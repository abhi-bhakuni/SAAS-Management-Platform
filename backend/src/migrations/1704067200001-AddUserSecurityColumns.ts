import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserSecurityColumns1704067200001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'loginAttempts',
        type: 'integer',
        default: 0,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'lockUntil',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'lockUntil');
    await queryRunner.dropColumn('users', 'loginAttempts');
  }
}
