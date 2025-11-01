import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Teacher } from '../users/entities/teacher.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Assignment } from '../users/entities/assignment.entity';
import { CreateTeacherDto } from '../users/dto/create-teacher.dto';
import { UpdateTeacherDto } from '../users/dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    private dataSource: DataSource,
  ) {}

  async create(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createTeacherDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Use a transaction to create both user and teacher
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(createTeacherDto.password, 10);

      // Create user
      const user = this.usersRepository.create({
        firstName: createTeacherDto.firstName,
        lastName: createTeacherDto.lastName,
        email: createTeacherDto.email,
        password: hashedPassword,
        role: UserRole.TEACHER,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Create teacher
      const teacher = this.teachersRepository.create({
        id: savedUser.id,
        instrument: createTeacherDto.instrument,
        experience: createTeacherDto.experience,
      });

      const savedTeacher = await queryRunner.manager.save(teacher);

      await queryRunner.commitTransaction();

      // Fetch the teacher with user relationship
      return this.findOne(savedTeacher.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Teacher[]> {
    const teachers = await this.teachersRepository.find({
      relations: ['user'],
    });

    // Fetch students for each teacher
    const teachersWithStudents = await Promise.all(
      teachers.map(async (teacher) => {
        const assignments = await this.assignmentsRepository.find({
          where: { teacherId: teacher.id },
          relations: ['student', 'student.user'],
        });
        
        return {
          ...teacher,
          students: assignments.map(assignment => {
            const student = assignment.student;
            // Add assignmentId to the student object
            (student as any).assignmentId = assignment.id;
            return student;
          }),
        };
      }),
    );

    return teachersWithStudents as any;
  }

  async findOne(id: string): Promise<Teacher> {
    const teacher = await this.teachersRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    // Fetch students for this teacher
    const assignments = await this.assignmentsRepository.find({
      where: { teacherId: teacher.id },
      relations: ['student', 'student.user'],
    });

    return {
      ...teacher,
      students: assignments.map(assignment => {
        const student = assignment.student;
        // Add assignmentId to the student object
        (student as any).assignmentId = assignment.id;
        return student;
      }),
    } as any;
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto): Promise<Teacher> {
    const teacher = await this.findOne(id);

    // Use a transaction to update both user and teacher
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update user fields if provided
      if (updateTeacherDto.firstName || updateTeacherDto.lastName || 
          updateTeacherDto.email || updateTeacherDto.password) {
        const user = teacher.user;

        if (updateTeacherDto.firstName) {
          user.firstName = updateTeacherDto.firstName;
        }
        if (updateTeacherDto.lastName) {
          user.lastName = updateTeacherDto.lastName;
        }
        if (updateTeacherDto.email && updateTeacherDto.email !== user.email) {
          // Check if email is already taken
          const existingUser = await this.usersRepository.findOne({
            where: { email: updateTeacherDto.email },
          });

          if (existingUser && existingUser.id !== user.id) {
            throw new ConflictException('User with this email already exists');
          }

          user.email = updateTeacherDto.email;
        }
        if (updateTeacherDto.password) {
          user.password = await bcrypt.hash(updateTeacherDto.password, 10);
        }

        await queryRunner.manager.save(user);
      }

      // Update teacher fields if provided
      if (updateTeacherDto.instrument) {
        teacher.instrument = updateTeacherDto.instrument;
      }
      if (updateTeacherDto.experience !== undefined) {
        teacher.experience = updateTeacherDto.experience;
      }

      await queryRunner.manager.save(teacher);

      await queryRunner.commitTransaction();

      // Fetch the updated teacher with user relationship
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const teacher = await this.findOne(id);
    
    // Deleting the user will cascade delete the teacher
    await this.usersRepository.remove(teacher.user);
  }
}

