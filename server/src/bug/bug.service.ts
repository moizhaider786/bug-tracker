import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateBugDto } from './dto/create-bug.dto';
import { Bugs } from './bug.entity';
import { BugStatus, BugType, NotificationTypes, UserRoles } from 'src/types';
import { Projects } from 'src/project/project.entity';
import { ProjectsToUsers } from 'src/project/project-to-user.entity';
import { UpdateBugDto } from './dto/update-bug.dto';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class BugService {
  constructor(
    @InjectRepository(Bugs) private readonly bugsRepo: Repository<Bugs>,
    @InjectRepository(Projects)
    private readonly projectsRepo: Repository<Projects>,
    @InjectRepository(ProjectsToUsers)
    private readonly projectsToUsersRepo: Repository<ProjectsToUsers>,
    private readonly notificationService: NotificationService,
  ) {}

  async createBug(data: CreateBugDto) {
    try {
      const isProjectQa = !!(await this.projectsToUsersRepo.findOne({
        where: { projectId: data.projectId, userId: data.createdBy },
      }));
      if (!isProjectQa) {
        throw new ForbiddenException('You are not assigned to this project');
      }
      const isProjectDev = !!(await this.projectsToUsersRepo.findOne({
        where: { projectId: data.projectId, userId: data.developerId },
      }));
      if (!isProjectDev) {
        throw new ForbiddenException(
          'The assigned developer is not part of this project',
        );
      }
      const bug = this.bugsRepo.create(data);
      const newBug = await this.bugsRepo.save(bug);

      this.notificationService
        .create({
          title: 'New Bug Assigned',
          description: `You have been assigned a new bug: "${newBug.title}"`,
          type: NotificationTypes.CREATE_BUG,
          users: [newBug.developerId],
        })
        .catch((error: Error) =>
          console.log(
            'Error Sending Bug Creation Notification: ',
            error?.message,
          ),
        );

      return newBug;
    } catch (error: any) {
      if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string }).code;
        if (code === 'ER_DUP_ENTRY') {
          throw new ConflictException('Bug title already exists');
        }
      }
      throw error;
    }
  }

  async updateBug(
    id: number,
    reqUserId: number,
    role: UserRoles,
    data: UpdateBugDto,
  ) {
    try {
      if (role === UserRoles.DEVELOPER) {
        const bug = await this.bugsRepo.findOne({
          where: { id, developerId: reqUserId },
        });
        if (!bug) {
          throw new ForbiddenException('You are not assigned to this bug');
        }
        if (bug.type === BugType.BUG && bug.status === BugStatus.COMPLETED)
          throw new BadRequestException('Invalid bug status against bug type.');
        else if (
          bug.type === BugType.FEATURE &&
          bug.status === BugStatus.RESOLVED
        )
          throw new BadRequestException('Invalid bug status against bug type.');
        bug.status = data.status ?? bug.status;
        bug.timelineSeconds = data.timelineSeconds ?? bug.timelineSeconds;
        const updatedBug = await this.bugsRepo.save(bug);

        this.notificationService
          .create({
            title: 'Bug Status Updated',
            description: `Bug "${updatedBug.title}" status changed to ${updatedBug.status}`,
            type: NotificationTypes.UPDATE_BUG,
            users: [updatedBug.createdBy],
          })
          .catch((error: Error) =>
            console.log(
              'Error Sending Bug Update Notification: ',
              error?.message,
            ),
          );

        return updatedBug;
      } else if (role === UserRoles.QA) {
        const bug = await this.bugsRepo.findOne({
          where: { id, createdBy: reqUserId },
        });
        if (!bug) {
          throw new ForbiddenException('You did not create this bug');
        }
        Object.assign(bug, data);
        const updatedBug = await this.bugsRepo.save(bug);

        this.notificationService
          .create({
            title: 'Bug Updated',
            description: `Bug "${updatedBug.title}" has been updated`,
            type: NotificationTypes.UPDATE_BUG,
            users: [updatedBug.developerId],
          })
          .catch((error: Error) =>
            console.log(
              'Error Sending Bug Update Notification: ',
              error?.message,
            ),
          );

        return updatedBug;
      } else if (role === UserRoles.MANAGER) {
        throw new ForbiddenException('Managers cannot update bugs');
      }
    } catch (error: any) {
      if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string }).code;
        if (code === 'ER_DUP_ENTRY') {
          throw new ConflictException('Bug title already exists');
        }
      }
      throw error;
    }
  }

  async getBugs(
    userId: number,
    role: UserRoles,
    page: number,
    pageSize: number,
    projectId?: number,
  ) {
    if (role === UserRoles.MANAGER) {
      return await this.bugsRepo.findAndCount({
        where: {
          ...(projectId && { id: projectId }),
          project: {
            createdBy: userId,
          },
        },
        order: {
          createdAt: 'DESC',
        },
        relations: {
          project: true,
        },
        select: {
          project: {
            name: true,
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    } else if (role === UserRoles.QA) {
      return await this.bugsRepo.find({
        where: {
          createdBy: userId,
          ...(projectId && { projectId }),
        },
        order: {
          createdAt: 'DESC',
        },
        relations: {
          project: true,
        },
        select: {
          project: {
            name: true,
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    } else if (role === UserRoles.DEVELOPER) {
      return await this.bugsRepo.find({
        where: {
          developerId: userId,
          ...(projectId && { projectId }),
        },
        order: {
          createdAt: 'DESC',
        },
        relations: {
          project: true,
        },
        select: {
          project: {
            name: true,
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    }
  }

  async getBugById(id: number) {
    return await this.bugsRepo.findOne({ where: { id } });
  }

  async deleteBug(id: number, reqUserId: number, role: UserRoles) {
    const bug = await this.bugsRepo.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!bug) {
      throw new NotFoundException('Bug not found');
    }
    if (role === UserRoles.MANAGER) {
      if (bug.project.createdBy !== reqUserId) {
        throw new ForbiddenException('You did not create this project');
      }
    } else if (role === UserRoles.QA) {
      if (bug.createdBy !== reqUserId) {
        throw new ForbiddenException('You did not create this bug');
      }
    } else if (role === UserRoles.DEVELOPER) {
      throw new ForbiddenException('Developers cannot delete bugs');
    }

    await this.bugsRepo.delete(id);

    this.notificationService
      .create({
        title: 'Bug Deleted',
        description: `Bug "${bug.title}" has been removed`,
        type: NotificationTypes.DELETE_BUG,
        users: [bug.developerId],
      })
      .catch((error: Error) =>
        console.log('Error Sending Bug Delete Notification: ', error?.message),
      );
  }
}
