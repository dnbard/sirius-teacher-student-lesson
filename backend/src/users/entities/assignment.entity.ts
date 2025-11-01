import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Teacher } from './teacher.entity';
import { Student } from './student.entity';

@Entity('assignments')
@Unique(['teacherId', 'studentId'])
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  teacherId: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @CreateDateColumn()
  createdAt: Date;
}

