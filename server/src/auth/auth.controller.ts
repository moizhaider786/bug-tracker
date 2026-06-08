import { Controller, Res, UnauthorizedException } from '@nestjs/common';
import { Post, Body, Req, Get } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from 'src/decorators/public-route.decorator';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { jwtConstants } from 'src/lib/constants';
import { JwtPayload } from 'src/types';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private userService: UserService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  @Public()
  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return await this.authService.signup(body);
  }

  @Public()
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('body ', body);
    const userData = await this.authService.login(body);

    const tokens = await this.authService.generateTokens(
      userData.id,
      userData.role,
    );

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      ...userData,
      access_token: tokens.accessToken,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken: string = req.cookies['refresh_token'] as string;
    if (!refreshToken) throw new UnauthorizedException();

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: jwtConstants.refreshSecret,
        },
      );

      const tokens = await this.authService.generateTokens(
        payload.id,
        payload.role,
      );

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { access_token: tokens.accessToken };
    } catch {
      throw new UnauthorizedException();
    }
  }

  @Get('me')
  async getProfile(@Req() req: Request) {
    return await this.userService.findOneById(req.user!.id);
  }
}
