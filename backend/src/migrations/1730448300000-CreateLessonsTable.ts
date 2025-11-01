import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateLessonsTable1730448300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'lessons',
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
            name: 'startTime',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'endTime',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'scheduled'",
          },
        ],
      }),
      true,
    );

    // Create foreign key to teachers table
    await queryRunner.createForeignKey(
      'lessons',
      new TableForeignKey({
        name: 'FK_LESSONS_TEACHER_ID',
        columnNames: ['teacherId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teachers',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key to students table
    await queryRunner.createForeignKey(
      'lessons',
      new TableForeignKey({
        name: 'FK_LESSONS_STUDENT_ID',
        columnNames: ['studentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'students',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.dropForeignKey('lessons', 'FK_LESSONS_TEACHER_ID');
    await queryRunner.dropForeignKey('lessons', 'FK_LESSONS_STUDENT_ID');
    
    // Drop the table
    await queryRunner.dropTable('lessons');
  }
}

