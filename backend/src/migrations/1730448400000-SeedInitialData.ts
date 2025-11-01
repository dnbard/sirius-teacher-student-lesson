import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedInitialData1730448400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hash passwords (using bcrypt with 10 rounds)
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Admin Users
    const adminIds = [
      '00000000-0000-0000-0000-000000000001',
    ];

    await queryRunner.query(
      `INSERT INTO users (id, "firstName", "lastName", email, password, role, "createdAt", "updatedAt") VALUES 
        ('${adminIds[0]}', 'System', 'Administrator', 'admin@sirius.com', '${hashedPassword}', 'admin', NOW(), NOW())`,
    );

    // 2. Create Teacher Users
    const teacherData = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        email: 'maria.rodriguez@sirius.com',
        instrument: 'Piano',
        experience: 15,
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        firstName: 'James',
        lastName: 'Chen',
        email: 'james.chen@sirius.com',
        instrument: 'Guitar',
        experience: 12,
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        firstName: 'Elena',
        lastName: 'Petrova',
        email: 'elena.petrova@sirius.com',
        instrument: 'Violin',
        experience: 20,
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        firstName: 'Marcus',
        lastName: 'Johnson',
        email: 'marcus.johnson@sirius.com',
        instrument: 'Drums',
        experience: 8,
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        firstName: 'Sophie',
        lastName: 'Dubois',
        email: 'sophie.dubois@sirius.com',
        instrument: 'Flute',
        experience: 10,
      },
    ];

    for (const teacher of teacherData) {
      // Insert into users table
      await queryRunner.query(
        `INSERT INTO users (id, "firstName", "lastName", email, password, role, "createdAt", "updatedAt") VALUES 
          ('${teacher.id}', '${teacher.firstName}', '${teacher.lastName}', '${teacher.email}', '${hashedPassword}', 'teacher', NOW(), NOW())`,
      );

      // Insert into teachers table
      await queryRunner.query(
        `INSERT INTO teachers (id, instrument, experience) VALUES 
          ('${teacher.id}', '${teacher.instrument}', ${teacher.experience})`,
      );
    }

    // 3. Create Student Users
    const studentData = [
      {
        id: '20000000-0000-0000-0000-000000000001',
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma.wilson@student.sirius.com',
        instrument: 'Piano',
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        firstName: 'Liam',
        lastName: 'Anderson',
        email: 'liam.anderson@student.sirius.com',
        instrument: 'Guitar',
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        firstName: 'Olivia',
        lastName: 'Martinez',
        email: 'olivia.martinez@student.sirius.com',
        instrument: 'Violin',
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        firstName: 'Noah',
        lastName: 'Taylor',
        email: 'noah.taylor@student.sirius.com',
        instrument: 'Drums',
      },
      {
        id: '20000000-0000-0000-0000-000000000005',
        firstName: 'Ava',
        lastName: 'Brown',
        email: 'ava.brown@student.sirius.com',
        instrument: 'Piano',
      },
      {
        id: '20000000-0000-0000-0000-000000000006',
        firstName: 'Ethan',
        lastName: 'Davis',
        email: 'ethan.davis@student.sirius.com',
        instrument: 'Guitar',
      },
      {
        id: '20000000-0000-0000-0000-000000000007',
        firstName: 'Isabella',
        lastName: 'Garcia',
        email: 'isabella.garcia@student.sirius.com',
        instrument: 'Flute',
      },
      {
        id: '20000000-0000-0000-0000-000000000008',
        firstName: 'Mason',
        lastName: 'Lee',
        email: 'mason.lee@student.sirius.com',
        instrument: 'Violin',
      },
    ];

    for (const student of studentData) {
      // Insert into users table
      await queryRunner.query(
        `INSERT INTO users (id, "firstName", "lastName", email, password, role, "createdAt", "updatedAt") VALUES 
          ('${student.id}', '${student.firstName}', '${student.lastName}', '${student.email}', '${hashedPassword}', 'student', NOW(), NOW())`,
      );

      // Insert into students table
      await queryRunner.query(
        `INSERT INTO students (id, instrument) VALUES 
          ('${student.id}', '${student.instrument}')`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete in reverse order due to foreign key constraints
    
    // Delete students
    await queryRunner.query(
      `DELETE FROM students WHERE id IN (
        '20000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000004',
        '20000000-0000-0000-0000-000000000005',
        '20000000-0000-0000-0000-000000000006',
        '20000000-0000-0000-0000-000000000007',
        '20000000-0000-0000-0000-000000000008'
      )`,
    );

    // Delete teachers
    await queryRunner.query(
      `DELETE FROM teachers WHERE id IN (
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000005'
      )`,
    );

    // Delete users (students, teachers, and admin)
    await queryRunner.query(
      `DELETE FROM users WHERE id IN (
        '00000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000005',
        '20000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000004',
        '20000000-0000-0000-0000-000000000005',
        '20000000-0000-0000-0000-000000000006',
        '20000000-0000-0000-0000-000000000007',
        '20000000-0000-0000-0000-000000000008'
      )`,
    );
  }
}

