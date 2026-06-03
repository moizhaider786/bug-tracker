import { Controller } from '@nestjs/common';
import { Post, Body } from '@nestjs/common';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from 'src/decorators/public-route.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return await this.authService.signup(body);
  }

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    console.log("body ", body)
    return await this.authService.login(body);
  }
}
