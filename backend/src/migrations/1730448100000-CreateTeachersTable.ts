import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTeachersTable1730448100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'teachers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'instrument',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'experience',
            type: 'int',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'teachers',
      new TableForeignKey({
        name: 'FK_TEACHERS_USER_ID',
        columnNames: ['id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    await queryRunner.dropForeignKey('teachers', 'FK_TEACHERS_USER_ID');
    
    // Drop the table
    await queryRunner.dropTable('teachers');
  }
}

