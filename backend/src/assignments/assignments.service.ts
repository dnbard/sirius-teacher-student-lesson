import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from '../users/entities/assignment.entity';
import { Teacher } from '../users/entities/teacher.entity';
import { Student } from '../users/entities/student.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateAssignmentDto } from '../users/dto/create-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto): Promise<Assignment> {
    const { teacherId, studentId } = createAssignmentDto;

    // Check if teacher exists and is actually a teacher
    const teacher = await this.teachersRepository.findOne({
      where: { id: teacherId },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    if (teacher.user.role !== UserRole.TEACHER) {
      throw new BadRequestException(`User with ID ${teacherId} is not a teacher`);
    }

    // Check if student exists and is actually a student
    const student = await this.studentsRepository.findOne({
      where: { id: studentId },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    if (student.user.role !== UserRole.STUDENT) {
      throw new BadRequestException(`User with ID ${studentId} is not a student`);
    }

    // Check if assignment already exists
    const existingAssignment = await this.assignmentsRepository.findOne({
      where: { teacherId, studentId },
    });

    if (existingAssignment) {
      throw new ConflictException(
        `Assignment between teacher ${teacherId} and student ${studentId} already exists`,
      );
    }

    // Create the assignment
    const assignment = this.assignmentsRepository.create({
      teacherId,
      studentId,
    });

    return this.assignmentsRepository.save(assignment);
  }

  async findStudentsByTeacher(teacherId: string): Promise<Student[]> {
    // First verify the teacher exists
    const teacher = await this.teachersRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Get all assignments for this teacher
    const assignments = await this.assignmentsRepository.find({
      where: { teacherId },
      relations: ['student', 'student.user'],
    });

    // Extract unique students from assignments
    const students = assignments.map(assignment => assignment.student);

    return students;
  }
}

