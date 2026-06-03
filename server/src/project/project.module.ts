import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Projects } from './project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Projects])],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
