import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Projects } from './project.entity';
import { ProjectsToUsers } from './project-to-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Projects, ProjectsToUsers])],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
