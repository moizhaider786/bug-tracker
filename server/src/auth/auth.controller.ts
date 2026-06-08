import { Controller } from '@nestjs/common';
import { Post, Body, Req, Get } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from 'src/decorators/public-route.decorator';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private userService: UserService,
  ) {}

  @Public()
  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return await this.authService.signup(body);
  }

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    console.log('body ', body);
    return await this.authService.login(body);
  }

  @Get('me')
  async getProfile(@Req() req: Request) {
    return await this.userService.findOneById(req.user!.id)
  }
}
