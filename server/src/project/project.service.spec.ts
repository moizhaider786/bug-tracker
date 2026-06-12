import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, QueryFailedError } from 'typeorm';
import { ProjectService } from './project.service';
import { Projects } from './project.entity';
import { ProjectsToUsers } from './project-to-user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { NotificationTypes, UserRoles } from 'src/types';

function makeQueryFailedError(code: string): QueryFailedError {
  const err = Object.create(QueryFailedError.prototype) as QueryFailedError;
  (err as any).driverError = { code };
  err.message = `DB error: ${code}`;
  return err;
}

function makeProject(overrides: Partial<Projects> = {}): Projects {
  return {
    id: 1,
    name: 'Test Project',
    description: 'desc',
    createdBy: 10,
    createdAt: new Date(),
    ...overrides,
  } as Projects;
}

const mockProjectRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
};

const mockProjectsToUsersRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockNotificationService = {
  create: jest.fn(),
};

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: getRepositoryToken(Projects), useValue: mockProjectRepo },
        {
          provide: getRepositoryToken(ProjectsToUsers),
          useValue: mockProjectsToUsersRepo,
        },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);

    mockNotificationService.create.mockResolvedValue(undefined);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createProject()', () => {
    const dto: CreateProjectDto = { name: 'My Project', createdBy: 10 };
    const built = { id: 1, name: 'My Project', createdBy: 10 };
    const saved = {
      id: 1,
      name: 'My Project',
      createdBy: 10,
      createdAt: new Date(),
    };

    beforeEach(() => {
      mockProjectRepo.create.mockReturnValue(built);
      mockProjectRepo.save.mockResolvedValue(saved);
    });

    it('should return the saved project', async () => {
      const result = await service.createProject(dto);
      console.log('result ', result);
      expect(result).toEqual(saved);
    });

    it('should fire a notification for the creator without awaiting it', async () => {
      // notification never resolves — createProject must still resolve
      mockNotificationService.create.mockReturnValue(new Promise(() => {}));
      await expect(service.createProject(dto)).resolves.toEqual(saved);
    });

    it('should throw ConflictException on ER_DUP_ENTRY', async () => {
      mockProjectRepo.save.mockRejectedValue(
        makeQueryFailedError('ER_DUP_ENTRY'),
      );
      await expect(service.createProject(dto)).rejects.toThrow(
        new ConflictException('Project name already exist'),
      );
    });
  });

  describe('getUserProjects()', () => {
    const page = 1,
      pageSize = 10,
      userId = 10;

    describe('MANAGER role', () => {
      it('should query projectRepo directly and return data + total', async () => {
        const projects = [makeProject()];
        mockProjectRepo.findAndCount.mockResolvedValue([projects, 1]);

        const result = await service.getUserProjects(
          userId,
          UserRoles.MANAGER,
          page,
          pageSize,
        );

        expect(mockProjectRepo.findAndCount).toHaveBeenCalledWith({
          where: { createdBy: userId },
          order: { createdAt: 'DESC' },
          skip: 0,
          take: pageSize,
        });
        expect(result).toEqual({ data: projects, total: 1 });
      });

      it('should throw NotFoundException when manager has no projects', async () => {
        mockProjectRepo.findAndCount.mockResolvedValue([[], 0]);
        await expect(
          service.getUserProjects(userId, UserRoles.MANAGER, page, pageSize),
        ).rejects.toThrow(new NotFoundException('No projects found'));
      });
    });

    describe('DEVELOPER role', () => {
      it('should query projectsToUsersRepo and map projects', async () => {
        const project = makeProject();
        const userProjects = [{ assignedAt: new Date(), project }];
        mockProjectsToUsersRepo.findAndCount.mockResolvedValue([
          userProjects,
          1,
        ]);

        const result = await service.getUserProjects(
          userId,
          UserRoles.DEVELOPER,
          page,
          pageSize,
        );

        expect(mockProjectsToUsersRepo.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({ where: { userId } }),
        );
        expect(result.total).toBe(1);
        expect(result.data[0]).toMatchObject({
          id: project.id,
          name: project.name,
        });
      });

      it('should throw NotFoundException when developer has no projects', async () => {
        mockProjectsToUsersRepo.findAndCount.mockResolvedValue([[], 0]);
        await expect(
          service.getUserProjects(userId, UserRoles.DEVELOPER, page, pageSize),
        ).rejects.toThrow(NotFoundException);
      });
    });

    it('should apply correct pagination skip on page 2', async () => {
      mockProjectRepo.findAndCount.mockResolvedValue([[makeProject()], 1]);
      await service.getUserProjects(userId, UserRoles.MANAGER, 2, 10);
      expect(mockProjectRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('addMembers()', () => {
    const projectId = 1,
      reqUserId = 10,
      members = [20, 30];
    const project = makeProject({ createdBy: reqUserId, projectUsers: [] });

    beforeEach(() => {
      mockProjectRepo.findOne.mockResolvedValue(project);
      mockProjectsToUsersRepo.save.mockResolvedValue([]);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockProjectRepo.findOne.mockResolvedValue(null);
      await expect(
        service.addMembers(projectId, reqUserId, members),
      ).rejects.toThrow(new NotFoundException('Project not found'));
    });

    it('should throw ForbiddenException when requester is not the owner', async () => {
      mockProjectRepo.findOne.mockResolvedValue(makeProject({ createdBy: 99 }));
      await expect(
        service.addMembers(projectId, reqUserId, members),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when manager is in the members list', async () => {
      await expect(
        service.addMembers(projectId, reqUserId, [reqUserId, 20]),
      ).rejects.toThrow(
        new BadRequestException('Manager can not be a project member'),
      );
    });

    it('should save only members not already in the project', async () => {
      // userId 20 is already a member
      mockProjectRepo.findOne.mockResolvedValue(
        makeProject({
          createdBy: reqUserId,
          projectUsers: [{ userId: 20 } as any],
        }),
      );
      await service.addMembers(projectId, reqUserId, [20, 30]);
      expect(mockProjectsToUsersRepo.save).toHaveBeenCalledWith([
        { projectId, userId: 30 },
      ]);
    });

    it('should not call save or notify when all members already exist', async () => {
      mockProjectRepo.findOne.mockResolvedValue(
        makeProject({
          createdBy: reqUserId,
          projectUsers: [{ userId: 20 }, { userId: 30 }] as ProjectsToUsers[],
        }),
      );
      await service.addMembers(projectId, reqUserId, [20, 30]);
      expect(mockProjectsToUsersRepo.save).not.toHaveBeenCalled();
      expect(mockNotificationService.create).not.toHaveBeenCalled();
    });

    it('should notify new members with correct payload', async () => {
      await service.addMembers(projectId, reqUserId, members);
      expect(mockNotificationService.create).toHaveBeenCalledWith({
        title: 'Added to Project',
        description: `You have been added to project "${project.name}"`,
        type: NotificationTypes.UPDATE_PROJECT,
        users: members,
      });
    });

    it('should not await the notification', async () => {
      mockNotificationService.create.mockReturnValue(new Promise(() => {}));
      await expect(
        service.addMembers(projectId, reqUserId, members),
      ).resolves.not.toThrow();
    });
  });

  describe('removeMembers()', () => {
    const projectId = 1,
      reqUserId = 10,
      members = [20, 30];
    const project = makeProject({ createdBy: reqUserId });

    beforeEach(() => {
      mockProjectRepo.findOne.mockResolvedValue(project);
      mockProjectsToUsersRepo.delete.mockResolvedValue({ affected: 2 });
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockProjectRepo.findOne.mockResolvedValue(null);
      await expect(
        service.removeMembers(projectId, reqUserId, members),
      ).rejects.toThrow(new NotFoundException('Project not found'));
    });

    it('should throw ForbiddenException when requester is not the owner', async () => {
      mockProjectRepo.findOne.mockResolvedValue(makeProject({ createdBy: 99 }));
      await expect(
        service.removeMembers(projectId, reqUserId, members),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should call delete with projectId and member ids', async () => {
      await service.removeMembers(projectId, reqUserId, members);
      expect(mockProjectsToUsersRepo.delete).toHaveBeenCalledWith({
        projectId,
        userId: In(members), // In(members) — typeorm In() wrapper
      });
    });

    it('should notify removed members with correct payload', async () => {
      await service.removeMembers(projectId, reqUserId, members);
      expect(mockNotificationService.create).toHaveBeenCalledWith({
        title: 'Removed from Project',
        description: `You have been removed from project "${project.name}"`,
        type: NotificationTypes.UPDATE_PROJECT,
        users: members,
      });
    });

    it('should not await the notification', async () => {
      mockNotificationService.create.mockReturnValue(new Promise(() => {}));
      await expect(
        service.removeMembers(projectId, reqUserId, members),
      ).resolves.not.toThrow();
    });
  });

  describe('updateProject()', () => {
    const projectId = 1,
      reqUserId = 10;
    const project = makeProject({
      createdBy: reqUserId,
      projectUsers: [{ userId: 20 } as any],
    });

    beforeEach(() => {
      mockProjectRepo.findOne.mockResolvedValue(project);
      mockProjectRepo.update.mockResolvedValue(undefined);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockProjectRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateProject({ name: 'X' } as any, projectId, reqUserId),
      ).rejects.toThrow(new NotFoundException('Project not found'));
    });

    it('should throw ForbiddenException when requester is not the owner', async () => {
      mockProjectRepo.findOne.mockResolvedValue(makeProject({ createdBy: 99 }));
      await expect(
        service.updateProject({ name: 'X' } as any, projectId, reqUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should call repo.update with only name when only name is provided', async () => {
      await service.updateProject({ name: 'New Name' }, projectId, reqUserId);
      expect(mockProjectRepo.update).toHaveBeenCalledWith(projectId, {
        name: 'New Name',
      });
    });

    it('should call repo.update with only description when only description is provided', async () => {
      await service.updateProject(
        { description: 'New Desc' },
        projectId,
        reqUserId,
      );
      expect(mockProjectRepo.update).toHaveBeenCalledWith(projectId, {
        description: 'New Desc',
      });
    });

    it('should call repo.update with both fields when both are provided', async () => {
      await service.updateProject(
        { name: 'New Name', description: 'New Desc' },
        projectId,
        reqUserId,
      );
      expect(mockProjectRepo.update).toHaveBeenCalledWith(projectId, {
        name: 'New Name',
        description: 'New Desc',
      });
    });

    it('should skip repo.update when dto has no name or description', async () => {
      await service.updateProject({}, projectId, reqUserId);
      expect(mockProjectRepo.update).not.toHaveBeenCalled();
    });

    it('should notify the owner and all project members', async () => {
      await service.updateProject({ name: 'X' }, projectId, reqUserId);
      expect(mockNotificationService.create).toHaveBeenCalledWith({
        title: 'Project Updated',
        description: `Project "${project.name}" has been updated`,
        type: NotificationTypes.UPDATE_PROJECT,
        users: [project.createdBy, 20],
      });
    });

    it('should throw ConflictException on ER_DUP_ENTRY during update', async () => {
      mockProjectRepo.update.mockRejectedValue(
        makeQueryFailedError('ER_DUP_ENTRY'),
      );
      await expect(
        service.updateProject(
          { name: 'Duplicate' } as any,
          projectId,
          reqUserId,
        ),
      ).rejects.toThrow(new ConflictException('Project name already exist'));
    });
  });
});
