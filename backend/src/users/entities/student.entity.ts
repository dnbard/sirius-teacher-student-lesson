import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('students')
export class Student {
  @PrimaryColumn('uuid')
  id: string; // Same as user.id

  @OneToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'id' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  instrument: string;
}

