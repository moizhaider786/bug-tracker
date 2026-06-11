import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './user.entity';
import { Projects } from 'src/project/project.entity';
import { Bugs } from 'src/bug/bug.entity';
import { ProjectsToUsers } from 'src/project/project-to-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Projects, Bugs, ProjectsToUsers])],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
