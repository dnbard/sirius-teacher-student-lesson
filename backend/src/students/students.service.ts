import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from '../users/entities/student.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateStudentDto } from '../users/dto/create-student.dto';
import { UpdateStudentDto } from '../users/dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createStudentDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Use a transaction to create both user and student
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(createStudentDto.password, 10);

      // Create user
      const user = this.usersRepository.create({
        firstName: createStudentDto.firstName,
        lastName: createStudentDto.lastName,
        email: createStudentDto.email,
        password: hashedPassword,
        role: UserRole.STUDENT,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Create student
      const student = this.studentsRepository.create({
        id: savedUser.id,
        instrument: createStudentDto.instrument,
      });

      const savedStudent = await queryRunner.manager.save(student);

      await queryRunner.commitTransaction();

      // Fetch the student with user relationship
      return this.findOne(savedStudent.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Student[]> {
    return this.studentsRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);

    // Use a transaction to update both user and student
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update user fields if provided
      if (updateStudentDto.firstName || updateStudentDto.lastName || 
          updateStudentDto.email || updateStudentDto.password) {
        const user = student.user;

        if (updateStudentDto.firstName) {
          user.firstName = updateStudentDto.firstName;
        }
        if (updateStudentDto.lastName) {
          user.lastName = updateStudentDto.lastName;
        }
        if (updateStudentDto.email && updateStudentDto.email !== user.email) {
          // Check if email is already taken
          const existingUser = await this.usersRepository.findOne({
            where: { email: updateStudentDto.email },
          });

          if (existingUser && existingUser.id !== user.id) {
            throw new ConflictException('User with this email already exists');
          }

          user.email = updateStudentDto.email;
        }
        if (updateStudentDto.password) {
          user.password = await bcrypt.hash(updateStudentDto.password, 10);
        }

        await queryRunner.manager.save(user);
      }

      // Update student fields if provided
      if (updateStudentDto.instrument) {
        student.instrument = updateStudentDto.instrument;
      }

      await queryRunner.manager.save(student);

      await queryRunner.commitTransaction();

      // Fetch the updated student with user relationship
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    
    // Deleting the user will cascade delete the student
    await this.usersRepository.remove(student.user);
  }
}

