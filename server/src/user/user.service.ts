import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Users } from './user.entity';
import { SignupDto } from 'src/auth/dto/signup.dto';
import { UserRoles } from 'src/types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private readonly usersRepo: Repository<Users>,
  ) {}

  async createUser(dto: SignupDto) {
    const user = this.usersRepo.create(dto);
    return await this.usersRepo.save(user);
  }

  async findOneById(id: number) {
    return await this.usersRepo.findOne({ where: { id } });
  }

  async findOneByEmail(email: string) {
    return await this.usersRepo.findOne({ where: { email } });
  }

  async findAll(roleFilter?: UserRoles[]) {
    return await this.usersRepo.find({
      where: roleFilter ? { role: In(roleFilter) } : {},
    });
  }
}
