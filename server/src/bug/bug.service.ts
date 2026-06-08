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
import { BugStatus, BugType, UserRoles } from 'src/types';
import { Projects } from 'src/project/project.entity';
import { ProjectsToUsers } from 'src/project/project-to-user.entity';
import { UpdateBugDto } from './dto/update-bug.dto';

@Injectable()
export class BugService {
  constructor(
    @InjectRepository(Bugs) private readonly bugsRepo: Repository<Bugs>,
    @InjectRepository(Projects)
    private readonly projectsRepo: Repository<Projects>,
    @InjectRepository(ProjectsToUsers)
    private readonly projectsToUsersRepo: Repository<ProjectsToUsers>,
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
          'The assigned developer is not part of this project'
        );
      }
      const bug = this.bugsRepo.create(data);
      return await this.bugsRepo.save(bug);
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
        return await this.bugsRepo.save(bug);
      } else if (role === UserRoles.QA) {
        const bug = await this.bugsRepo.findOne({
          where: { id, createdBy: reqUserId },
        });
        if (!bug) {
          throw new ForbiddenException('You did not create this bug');
        }
        Object.assign(bug, data);
        return await this.bugsRepo.save(bug);
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

  async getBugs(userId: number, role: UserRoles, projectId?: number) {
    if (role === UserRoles.MANAGER) {
      const projects = await this.projectsRepo.find({
        where: {
          createdBy: userId,
          ...(projectId && { id: projectId }),
        },
        relations: { bugs: true },
        select: { bugs: true },
      });

      return projects.flatMap((project) => project.bugs);
    } else if (role === UserRoles.QA) {
      return await this.bugsRepo.find({
        where: {
          createdBy: userId,
          ...(projectId && { projectId }),
        },
      });
    } else if (role === UserRoles.DEVELOPER) {
      return await this.bugsRepo.find({
        where: {
          developerId: userId,
          ...(projectId && { projectId }),
        },
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
  }
}
