import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BugController } from './bug.controller';
import { BugService } from './bug.service';
import { Bugs } from './bug.entity';
import { Projects } from 'src/project/project.entity';
import { ProjectsToUsers } from 'src/project/project-to-user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Bugs, Projects, ProjectsToUsers])],
  controllers: [BugController],
  providers: [BugService]
})
export class BugModule {}
