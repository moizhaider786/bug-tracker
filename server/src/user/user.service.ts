import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Users } from './user.entity';
import { SignupDto } from 'src/auth/dto/signup.dto';
import { BugStatus, BugType, UserRoles } from 'src/types';
import { Projects } from 'src/project/project.entity';
import { Bugs } from 'src/bug/bug.entity';
import { BugsData } from './dto/get-user-projects-and-bugs-count.dto';
import { ProjectsToUsers } from 'src/project/project-to-user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private readonly usersRepo: Repository<Users>,
    @InjectRepository(Projects)
    private readonly projectsRepo: Repository<Projects>,
    @InjectRepository(ProjectsToUsers)
    private readonly projectsToUsersRepo: Repository<ProjectsToUsers>,
    @InjectRepository(Bugs) private readonly bugsRepo: Repository<Bugs>,
  ) {}

  async createUser(dto: SignupDto) {
    const user = this.usersRepo.create(dto);
    return await this.usersRepo.save(user);
  }

  async findOneById(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByEmail(email: string) {
    return await this.usersRepo.findOne({ where: { email } });
  }

  async findAll(roleFilter?: UserRoles[]) {
    return await this.usersRepo.find({
      where: roleFilter ? { role: In(roleFilter) } : {},
    });
  }
  async getUserProjectsAndBugsCount(id: number, role: UserRoles) {
    if (role === UserRoles.MANAGER) {
      return await this.getManagerProjectsAndBugsCount(id);
    }

    if (role === UserRoles.DEVELOPER) {
      return await this.getDeveloperProjectsAndBugsCount(id);
    }

    if (role === UserRoles.QA) {
      return await this.getQaProjectsAndBugsCount(id);
    }

    throw new UnauthorizedException();
  }

  async getManagerProjectsAndBugsCount(id: number) {
    const [createdProjectsCount, bugsData] = await Promise.all([
      this.projectsRepo
        .createQueryBuilder('project')
        .where('project.createdBy = :id', { id })
        .getCount(),

      this.buildBugsQuery()
        .innerJoin('bug.project', 'project')
        .where('project.createdBy = :id', { id })
        .setParameter('id', id)
        .getRawOne<BugsData>(),
    ]);

    const { bugCount, featureCount, statusBreakdown } =
      this.parseBugsData(bugsData);

    return {
      createdProjectsCount,
      bugsInCreatedProjects: { bugCount, featureCount },
      statusBreakdown,
    };
  }

  async getDeveloperProjectsAndBugsCount(id: number) {
    const [assignedProjectsCount, bugsData] = await Promise.all([
      this.projectsToUsersRepo
        .createQueryBuilder('projects_to_users')
        .where('projects_to_users.userId = :id', { id })
        .getCount(),

      this.buildBugsQuery()
        .where('bug.developerId = :id', { id })
        .getRawOne<BugsData>(),
    ]);

    const { bugCount, featureCount, statusBreakdown } =
      this.parseBugsData(bugsData);

    return {
      assignedProjectsCount,
      assignedBugs: { bugCount, featureCount },
      statusBreakdown,
    };
  }

  async getQaProjectsAndBugsCount(id: number) {
    const [assignedProjectsCount, bugsData] = await Promise.all([
      this.projectsToUsersRepo
        .createQueryBuilder('projects_to_users')
        .where('projects_to_users.userId = :id', { id })
        .getCount(),

      this.buildBugsQuery()
        .where('bug.createdBy = :id', { id })
        .getRawOne<BugsData>(),
    ]);

    const { bugCount, featureCount, statusBreakdown } =
      this.parseBugsData(bugsData);

    return {
      assignedProjectsCount,
      createdBugs: { bugCount, featureCount },
      statusBreakdown,
    };
  }

  private buildBugsQuery() {
    return this.bugsRepo
      .createQueryBuilder('bug')
      .select(
        `SUM(CASE WHEN bug.type = :bugType THEN 1 ELSE 0 END)`,
        'bugCount',
      )
      .addSelect(
        `SUM(CASE WHEN bug.type = :featureType THEN 1 ELSE 0 END)`,
        'featureCount',
      )
      .addSelect(
        `SUM(CASE WHEN bug.type = :bugType AND bug.status = :new THEN 1 ELSE 0 END)`,
        'bugNew',
      )
      .addSelect(
        `SUM(CASE WHEN bug.type = :bugType AND bug.status = :started THEN 1 ELSE 0 END)`,
        'bugStarted',
      )
      .addSelect(
        `SUM(CASE WHEN bug.type = :bugType AND bug.status = :resolved THEN 1 ELSE 0 END)`,
        'bugResolved',
      )
      .addSelect(
        `SUM(CASE WHEN bug.type = :featureType AND bug.status = :new THEN 1 ELSE 0 END)`,
        'featureNew',
      )
      .addSelect(
        `SUM(CASE WHEN bug.type = :featureType AND bug.status = :started THEN 1 ELSE 0 END)`,
        'featureStarted',
      )
      .addSelect(
        `SUM(CASE WHEN bug.type = :featureType AND bug.status = :resolved THEN 1 ELSE 0 END)`,
        'featureResolved',
      )
      .setParameters({
        bugType: BugType.BUG,
        featureType: BugType.FEATURE,
        new: BugStatus.NEW,
        started: BugStatus.STARTED,
        resolved: BugStatus.RESOLVED,
      });
  }

  private parseBugsData(bugsData: BugsData | undefined) {
    return {
      bugCount: Number(bugsData?.bugCount ?? 0),
      featureCount: Number(bugsData?.featureCount ?? 0),
      statusBreakdown: this.parseBugsStatusBreakdown(bugsData),
    };
  }

  private parseBugsStatusBreakdown(raw: BugsData | undefined) {
    return {
      bugs: {
        new: Number(raw?.bugNew ?? 0),
        started: Number(raw?.bugStarted ?? 0),
        resolved: Number(raw?.bugResolved ?? 0),
      },
      features: {
        new: Number(raw?.featureNew ?? 0),
        started: Number(raw?.featureStarted ?? 0),
        resolved: Number(raw?.featureResolved ?? 0),
      },
    };
  }
}
