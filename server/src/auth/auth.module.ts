import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Users } from 'src/user/user.entity';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { AuthController } from './auth.controller';
import { Projects } from 'src/project/project.entity';
import { Bugs } from 'src/bug/bug.entity';
import { ProjectsToUsers } from 'src/project/project-to-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Projects, Bugs, ProjectsToUsers]),
    JwtModule.register({
      global: true,
    }),
  ],
  providers: [
    AuthService,
    UserService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
