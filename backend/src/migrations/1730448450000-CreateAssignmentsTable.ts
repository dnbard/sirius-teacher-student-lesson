import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAssignmentsTable1730448450000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'assignments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'teacherId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'studentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create unique constraint on teacherId and studentId combination
    await queryRunner.createIndex(
      'assignments',
      new TableIndex({
        name: 'IDX_ASSIGNMENTS_TEACHER_STUDENT_UNIQUE',
        columnNames: ['teacherId', 'studentId'],
        isUnique: true,
      }),
    );

    // Create foreign key to teachers table
    await queryRunner.createForeignKey(
      'assignments',
      new TableForeignKey({
        name: 'FK_ASSIGNMENTS_TEACHER_ID',
        columnNames: ['teacherId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teachers',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key to students table
    await queryRunner.createForeignKey(
      'assignments',
      new TableForeignKey({
        name: 'FK_ASSIGNMENTS_STUDENT_ID',
        columnNames: ['studentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'students',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.dropForeignKey('assignments', 'FK_ASSIGNMENTS_STUDENT_ID');
    await queryRunner.dropForeignKey('assignments', 'FK_ASSIGNMENTS_TEACHER_ID');
    
    // Drop the index
    await queryRunner.dropIndex('assignments', 'IDX_ASSIGNMENTS_TEACHER_STUDENT_UNIQUE');
    
    // Drop the table
    await queryRunner.dropTable('assignments');
  }
}

