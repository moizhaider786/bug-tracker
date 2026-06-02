import { Injectable } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PASSWORD_SALT } from 'src/lib/constants';

import { UserService } from 'src/user/user.service';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async signup(dto: SignupDto) {
    const user = await this.userService.findOneByEmail(dto.email);
    if (user !== null) throw new ConflictException('User already Exists');
    dto.password = await bcrypt.hash(dto.password, PASSWORD_SALT);
    const newUser = await this.userService.createUser(dto);
    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };
  }
}
