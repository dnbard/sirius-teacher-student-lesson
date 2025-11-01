import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminRoleToEnum1730448350000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'admin' to the users_role_enum type
    await queryRunner.query(`
      ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'admin'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum and updating all references
    // For simplicity, we'll leave the enum value in place
    // If you need to remove it, you would need to:
    // 1. Create a new enum without 'admin'
    // 2. Alter the column to use the new enum
    // 3. Drop the old enum
    console.warn('Removing enum values is not straightforward in PostgreSQL. The admin role will remain in the enum.');
  }
}

