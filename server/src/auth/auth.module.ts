import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/user/user.entity';

import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users])
  ],
  providers: [AuthService, UserService],
  controllers: [AuthController]
})
export class AuthModule {}
