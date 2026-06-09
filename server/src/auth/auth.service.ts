import { BadRequestException, Injectable } from '@nestjs/common';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { jwtConstants, PASSWORD_SALT } from 'src/lib/constants';
import { UserService } from 'src/user/user.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, UserRoles } from 'src/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

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
      createdAt: newUser.createdAt,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findOneByEmail(dto.email);
    if (!user) throw new NotFoundException('User with given email not found.');
    const isPasswordMatch = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordMatch) throw new BadRequestException('Incorrect Password');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async generateTokens(userId: number, role: UserRoles) {
    const payload: JwtPayload = { id: userId, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtConstants.secret,
        expiresIn: jwtConstants.tokenExpiryTime,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtConstants.refreshSecret,
        expiresIn: jwtConstants.refreshTokenExpiryTime,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
