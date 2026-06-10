import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryFailedError, In } from 'typeorm';

import { Projects } from './project.entity';
import { ProjectsToUsers } from './project-to-user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { NotificationTypes, UserRoles } from 'src/types';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Projects)
    private readonly projectRepo: Repository<Projects>,
    @InjectRepository(ProjectsToUsers)
    private readonly projectsToUsersRepo: Repository<ProjectsToUsers>,
    private readonly notificationService: NotificationService,
  ) {}

  async createProject(data: CreateProjectDto) {
    const project = this.projectRepo.create(data);
    try {
      const newProject = await this.projectRepo.save(project);
      this.notificationService
        .create({
          title: 'New Project Created',
          description: `You have been added to project "${project.name}"`,
          type: NotificationTypes.CREATE_PROJECT,
          users: [project.createdBy],
        })
        .catch((error: Error) =>
          console.log(
            'Error Sending Project Creation Notification: ',
            error?.message,
          ),
        );
      return newProject;
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
    let projects: Projects[];
    if (role === UserRoles.MANAGER) {
      projects = await this.projectRepo.find({
        where: { createdBy: userId },
        order: { createdAt: 'DESC' },
      });
    } else {
      const userProjects = await this.projectsToUsersRepo.find({
        where: { userId: userId },
        relations: { project: true },
        order: {
          project: {
            createdAt: "DESC"
          }
        }
      });

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
        throw new ForbiddenException(
          'Not authroized to update other manager projects',
        );
      if (members.some((userId) => userId === reqUserId))
        throw new BadRequestException('Manager can not be a project member');
      const filteredMembers = members.filter(
        (userId) => !project.projectUsers.some((pu) => pu.userId === userId),
      );
      if (filteredMembers.length) {
        await this.projectsToUsersRepo.save(
          filteredMembers.map((userId) => ({
            projectId: projectId,
            userId,
          })),
        );
        this.notificationService
          .create({
            title: 'Added to Project',
            description: `You have been added to project "${project.name}"`,
            type: NotificationTypes.UPDATE_PROJECT,
            users: filteredMembers,
          })
          .catch((error: Error) =>
            console.log(
              'Error Sending Add Members Notification: ',
              error?.message,
            ),
          );
      }
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
      throw new ForbiddenException(
        'Not authroized to update other manager projects',
      );
    await this.projectsToUsersRepo.delete({
      projectId: projectId,
      userId: In(members),
    });
    this.notificationService
      .create({
        title: 'Removed from Project',
        description: `You have been removed from project "${project.name}"`,
        type: NotificationTypes.UPDATE_PROJECT,
        users: members,
      })
      .catch((error: Error) =>
        console.log(
          'Error Sending Remove Members Notification: ',
          error?.message,
        ),
      );
  }

  async updateProject(
    data: UpdateProjectDto,
    projectId: number,
    reqUserId: number,
  ) {
    try {
      const project = await this.projectRepo.findOne({
        where: { id: projectId },
        relations: { projectUsers: true },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (project.createdBy !== reqUserId)
        throw new ForbiddenException(
          'Not authroized to update other manager projects',
        );
      if (data.name || data.description) {
        await this.projectRepo.update(projectId, {
          ...(data.name ? { name: data.name } : {}),
          ...(data.description ? { description: data.description } : {}),
        });
      }
      this.notificationService
        .create({
          title: 'Project Updated',
          description: `Project "${project.name}" has been updated`,
          type: NotificationTypes.UPDATE_PROJECT,
          users: [
            project.createdBy,
            ...project.projectUsers.map((pu) => pu.userId),
          ],
        })
        .catch((error: Error) =>
          console.log(
            'Error Sending Project Update Notification: ',
            error?.message,
          ),
        );
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

  async getById(id: number) {
    const project = await this.projectRepo.findOne({
      where: { id },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async getProjectMembers(id: number, reqUserId: number, role?: UserRoles) {
    const isMember = await this.projectsToUsersRepo.findOne({
      where: {
        projectId: id,
        userId: reqUserId,
      },
    });
    const project = await this.projectRepo.findOne({
      where: {
        id,
        ...(role && {
          projectUsers: {
            user: {
              role: UserRoles.DEVELOPER,
            },
          },
        }),
      },
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
    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You are not authorized to access this project members',
      );
    }
    return project.projectUsers.map((m) => m.user).filter((user) => !!user);
  }
}
