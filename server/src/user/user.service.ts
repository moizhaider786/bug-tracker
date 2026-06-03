import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Users } from './user.entity';
import { SignupDto } from 'src/auth/dto/signup.dto';

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
    return await this.usersRepo.findOne({ where: {email} });
  }
}
