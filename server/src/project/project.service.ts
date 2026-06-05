import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryFailedError, In } from 'typeorm';

import { Projects } from './project.entity';
import { ProjectsToUsers } from './project-to-user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserRoles } from 'src/types';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Projects)
    private readonly projectRepo: Repository<Projects>,
    @InjectRepository(ProjectsToUsers)
    private readonly projectsToUsersRepo: Repository<ProjectsToUsers>,
  ) {}

  async createProject(data: CreateProjectDto) {
    const project = this.projectRepo.create(data);
    try {
      return await this.projectRepo.save(project);
    } catch (error: any) {
      if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string }).code;
        if (code === 'ER_DUP_ENTRY') {
          throw new ConflictException('Project name already exist');
        }
      }
      throw error;
    }
  }

  async getUserProjects(userId: number, role: UserRoles) {
    let projects: any[];
    if (role === UserRoles.MANAGER) {
      projects = await this.projectRepo.find({ where: { createdBy: userId } });
    } else {
      const userProjects = await this.projectsToUsersRepo.find({
        where: { userId: userId },
        relations: { project: true },
      });
      console.log('User id ', userId);
      console.log('user projects ', JSON.stringify(userProjects, null, 2));
      projects = userProjects.map((up) => ({
        assignedAt: up.assignedAt,
        ...up.project,
      }));
    }
    if (!projects?.length) throw new NotFoundException('No projects found');
    return projects;
  }

  async addMembers(projectId: number, reqUserId: number, members: number[]) {
    try {
      const project = await this.projectRepo.findOne({
        where: { id: projectId },
        relations: {
          projectUsers: true,
        },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (project.createdBy !== reqUserId)
        throw new UnauthorizedException(
          'Not authroized to update other manager projects',
        );
      if (members.some((userId) => userId === reqUserId))
        throw new BadRequestException('Manager can not be a project member');
      const filteredMembers = members.filter(
        (userId) => !project.projectUsers.some((pu) => pu.userId === userId),
      );
      console.log('members ', members);
      console.log('filtered members ', filteredMembers);
      console.log('project users ', project.projectUsers);
      await this.projectsToUsersRepo.save(
        filteredMembers.map((userId) => ({
          projectId: projectId,
          userId,
        })),
      );
    } catch (error: any) {
      console.log('Custom Error ', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async removeMembers(projectId: number, reqUserId: number, members: number[]) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.createdBy !== reqUserId)
      throw new UnauthorizedException(
        'Not authroized to update other manager projects',
      );
    await this.projectsToUsersRepo.delete({
      projectId: projectId,
      userId: In(members),
    });
  }

  async updateProject(
    data: UpdateProjectDto,
    projectId: number,
    reqUserId: number,
  ) {
    try {
      const project = await this.projectRepo.findOne({
        where: { id: projectId },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (project.createdBy !== reqUserId)
        throw new UnauthorizedException(
          'Not authroized to update other manager projects',
        );
      if (data.name || data.description) {
        await this.projectRepo.update(projectId, {
          ...(data.name ? { name: data.name } : {}),
          ...(data.description ? { description: data.description } : {}),
        });
      }
    } catch (error: any) {
      console.log('Custom Error ', error);
      throw error;
    }
  }

  async getById(id: number) {
    const project = await this.projectRepo.findOne({
      where: { id },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async getProjectMembers(id: number, reqUserId: number) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: {
        projectUsers: {
          user: true,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const isOwner = project.createdBy === reqUserId;
    const isMember = project.projectUsers.some((u) => u.user?.id === reqUserId);
    if (!isOwner && !isMember) {
      throw new UnauthorizedException(
        'You are not authorized to access this project members',
      );
    }
    return project.projectUsers.map((m) => m.user).filter((user) => !!user); // Filter out any broken structural rows just in case
  }
}
