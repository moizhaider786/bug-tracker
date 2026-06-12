import { Test, TestingModule } from '@nestjs/testing';
import { BugService } from './bug.service';
import { Bugs } from './bug.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectsToUsers } from 'src/project/project-to-user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { CreateBugDto } from './dto/create-bug.dto';
import { BugStatus, BugType, UserRoles } from 'src/types';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { UpdateBugDto } from './dto/update-bug.dto';

function makeQueryFailedError(code: string): QueryFailedError {
  const err = Object.create(QueryFailedError.prototype) as QueryFailedError;
  (err as any).driverError = { code };
  err.message = `DB error: ${code}`;
  return err;
}
function getBugs(overrides: Partial<Bugs> = {}): Partial<Bugs>[] {
  return [
    {
      id: 1,
      title: 'test bug',
      description: 'test description',
      type: BugType.BUG,
      status: BugStatus.NEW,
      projectId: 1,
      developerId: 1,
      createdBy: 2,
      timelineSeconds: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    },
  ];
}
const mockNotificationService = {
  create: jest.fn(),
};

const mockProjectsToUsersRepo = {
  findOne: jest.fn(),
};

const mockBugsRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('BugSurvice', () => {
  let service: BugService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BugService,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: getRepositoryToken(Bugs), useValue: mockBugsRepo },
        {
          provide: getRepositoryToken(ProjectsToUsers),
          useValue: mockProjectsToUsersRepo,
        },
      ],
    }).compile();
    service = module.get<BugService>(BugService);
    mockNotificationService.create.mockResolvedValue(undefined);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createBug()', () => {
    const createBugDto: CreateBugDto = {
      title: 'test bug',
      description: 'test description',
      type: BugType.BUG,
      status: BugStatus.NEW,
      projectId: 1,
      developerId: 1,
      createdBy: 1,
    };
    const savedBug = getBugs()[0];
    beforeEach(() => {
      mockBugsRepo.create.mockReturnValue(savedBug);
      mockBugsRepo.save.mockResolvedValue(savedBug);
    });
    it('should create and return new bug', async () => {
      mockProjectsToUsersRepo.findOne.mockResolvedValueOnce({
        // qa check
        userId: 2,
        projectId: 1,
      });
      mockProjectsToUsersRepo.findOne.mockResolvedValueOnce({
        // dev check
        userId: 1,
        projectId: 1,
      });
      const bug = await service.createBug(createBugDto);
      expect(bug).toEqual(savedBug);
    });

    it('should throw forbidden error if bug QA not assinged to project', async () => {
      mockProjectsToUsersRepo.findOne.mockResolvedValueOnce(null); // QA not found
      await expect(service.createBug(createBugDto)).rejects.toThrow(
        new ForbiddenException('You are not assigned to this project'),
      );
    });

    it('should throw forbidden error if bug Developer not assigend to project', async () => {
      mockProjectsToUsersRepo.findOne.mockResolvedValueOnce({
        userId: 1,
        projectId: 2,
      });
      mockProjectsToUsersRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.createBug(createBugDto)).rejects.toThrow(
        new ForbiddenException(
          'The assigned developer is not part of this project',
        ),
      );
    });

    it('should throw custom error in case of bug title conflict', async () => {
      mockProjectsToUsersRepo.findOne.mockResolvedValue({
        //qa check
        userId: 2,
        projectId: 1,
      });
      mockProjectsToUsersRepo.findOne.mockResolvedValue({
        //dev check
        userId: 1,
        projectId: 1,
      });
      mockBugsRepo.save.mockRejectedValue(makeQueryFailedError('ER_DUP_ENTRY'));
      await expect(service.createBug(createBugDto)).rejects.toThrow(
        new ConflictException('Bug title already exists'),
      );
    });
  });

  describe('updateBug()', () => {
    const updateBugDto: UpdateBugDto = {
      title: 'new Title',
      type: BugType.FEATURE,
      status: BugStatus.STARTED,
      timelineSeconds: 10,
    };

    describe('role: DEVELOPER', () => {
      it('should throw ForbiddenException when developer is not assigned to bug', async () => {
        mockBugsRepo.findOne.mockResolvedValue(null);
        await expect(
          service.updateBug(1, 10, UserRoles.DEVELOPER, updateBugDto),
        ).rejects.toThrow(
          new ForbiddenException('You are not assigned to this bug'),
        );
      });

      it('should throw BadRequestException when BUG type gets COMPLETED status', async () => {
        mockBugsRepo.findOne.mockResolvedValue(
          getBugs({ type: BugType.BUG })[0],
        );
        await expect(
          service.updateBug(1, 1, UserRoles.DEVELOPER, {
            status: BugStatus.COMPLETED,
          }),
        ).rejects.toThrow(
          new BadRequestException('Invalid bug status against bug type.'),
        );
      });

      it('should throw BadRequestException when FEATURE type gets RESOLVED status', async () => {
        mockBugsRepo.findOne.mockResolvedValue(
          getBugs({ type: BugType.FEATURE })[0],
        );
        await expect(
          service.updateBug(1, 1, UserRoles.DEVELOPER, {
            status: BugStatus.RESOLVED,
          }),
        ).rejects.toThrow(
          new BadRequestException('Invalid bug status against bug type.'),
        );
      });

      it('should update status and timelineSeconds and return updated bug', async () => {
        const bug = getBugs({ type: BugType.BUG, status: BugStatus.NEW })[0];
        const updated = {
          ...bug,
          status: BugStatus.STARTED,
          timelineSeconds: 10,
        };
        mockBugsRepo.findOne.mockResolvedValue(bug);
        mockBugsRepo.save.mockResolvedValue(updated);

        const result = await service.updateBug(1, 1, UserRoles.DEVELOPER, {
          status: BugStatus.STARTED,
          timelineSeconds: 10,
        });

        expect(result).toEqual(updated);
        expect(mockBugsRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            status: BugStatus.STARTED,
            timelineSeconds: 10,
          }),
        );
      });

      describe('role: QA', () => {
        it('should throw ForbiddenException when QA did not create the bug', async () => {
          mockBugsRepo.findOne.mockResolvedValue(null);
          await expect(
            service.updateBug(1, 10, UserRoles.QA, updateBugDto),
          ).rejects.toThrow(
            new ForbiddenException('You did not create this bug'),
          );
        });

        it('should throw BadRequestException when BUG type gets COMPLETED status', async () => {
          mockBugsRepo.findOne.mockResolvedValue(
            getBugs({ type: BugType.BUG })[0],
          );
          await expect(
            service.updateBug(1, 1, UserRoles.QA, {
              status: BugStatus.COMPLETED,
            }),
          ).rejects.toThrow(
            new BadRequestException('Invalid bug status against bug type.'),
          );
        });

        it('should update bug fields via Object.assign and return updated bug', async () => {
          const bug = getBugs({ type: BugType.BUG })[0];
          const updated = {
            ...bug,
            title: 'new Title',
            status: BugStatus.STARTED,
          };
          mockBugsRepo.findOne.mockResolvedValue(bug);
          mockBugsRepo.save.mockResolvedValue(updated);

          const result = await service.updateBug(
            1,
            1,
            UserRoles.QA,
            updateBugDto,
          );

          expect(result).toEqual(updated);
          expect(mockBugsRepo.save).toHaveBeenCalled();
        });
      });

      describe('role: MANAGER', () => {
        it('should throw ForbiddenException — managers cannot update bugs', async () => {
          await expect(
            service.updateBug(1, 1, UserRoles.MANAGER, updateBugDto),
          ).rejects.toThrow(
            new ForbiddenException('Managers cannot update bugs'),
          );
        });
      });
    });
    it('should throw ConflictException on ER_DUP_ENTRY from save', async () => {
      const bug = getBugs({ type: BugType.BUG })[0];
      mockBugsRepo.findOne.mockResolvedValue(bug);
      mockBugsRepo.save.mockRejectedValue(makeQueryFailedError('ER_DUP_ENTRY'));

      await expect(
        service.updateBug(1, 1, UserRoles.DEVELOPER, {
          status: BugStatus.STARTED,
        }),
      ).rejects.toThrow(new ConflictException('Bug title already exists'));
    });
  });

  describe('deleteBug()', () => {
    const bugId = 1;

    const makeBug = (overrides = {}) => ({
      id: bugId,
      title: 'Login crash',
      developerId: 5,
      createdBy: 2,
      project: { id: 1, createdBy: 10 },
      ...overrides,
    });

    beforeEach(() => {
      mockBugsRepo.delete.mockResolvedValue({ affected: 1 });
    });

    it('should throw NotFoundException when bug does not exist', async () => {
      mockBugsRepo.findOne.mockResolvedValue(null);
      await expect(
        service.deleteBug(bugId, 10, UserRoles.MANAGER),
      ).rejects.toThrow(new NotFoundException('Bug not found'));
    });

    describe('role: MANAGER', () => {
      it('should delete bug when manager owns the project', async () => {
        mockBugsRepo.findOne.mockResolvedValue(
          makeBug({ project: { createdBy: 10 } }),
        );
        await expect(
          service.deleteBug(bugId, 10, UserRoles.MANAGER),
        ).resolves.not.toThrow();
        expect(mockBugsRepo.delete).toHaveBeenCalledWith(bugId);
      });

      it('should throw ForbiddenException when manager did not create the project', async () => {
        mockBugsRepo.findOne.mockResolvedValue(
          makeBug({ project: { createdBy: 99 } }),
        );
        await expect(
          service.deleteBug(bugId, 10, UserRoles.MANAGER),
        ).rejects.toThrow(
          new ForbiddenException('You did not create this project'),
        );
      });
    });

    describe('role: QA', () => {
      it('should delete bug when QA created it', async () => {
        mockBugsRepo.findOne.mockResolvedValue(makeBug({ createdBy: 2 }));
        await expect(
          service.deleteBug(bugId, 2, UserRoles.QA),
        ).resolves.not.toThrow();
        expect(mockBugsRepo.delete).toHaveBeenCalledWith(bugId);
      });

      it('should throw ForbiddenException when QA did not create the bug', async () => {
        mockBugsRepo.findOne.mockResolvedValue(makeBug({ createdBy: 99 }));
        await expect(service.deleteBug(bugId, 2, UserRoles.QA)).rejects.toThrow(
          new ForbiddenException('You did not create this bug'),
        );
      });
    });

    describe('role: DEVELOPER', () => {
      it('should always throw ForbiddenException for developers', async () => {
        mockBugsRepo.findOne.mockResolvedValue(makeBug());
        await expect(
          service.deleteBug(bugId, 5, UserRoles.DEVELOPER),
        ).rejects.toThrow(
          new ForbiddenException('Developers cannot delete bugs'),
        );
      });

      it('should not call delete for developers', async () => {
        mockBugsRepo.findOne.mockResolvedValue(makeBug());
        await service.deleteBug(bugId, 5, UserRoles.DEVELOPER).catch(() => {});
        expect(mockBugsRepo.delete).not.toHaveBeenCalled();
      });
    });
  });
});
