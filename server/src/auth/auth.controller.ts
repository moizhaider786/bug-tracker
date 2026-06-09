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
  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string>)[
      'refresh_token'
    ];
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
        maxAge: jwtConstants.refreshTokenExpiryTime,
      });

      return { access_token: tokens.accessToken };
    } catch (error: any) {
      console.log('Error ', error);
      throw new UnauthorizedException(
        error?.message || 'Failed refreshing token',
      );
    }
  }

  @Get('me')
  async getProfile(@Req() req: Request) {
    return await this.userService.findOneById(req.user!.id);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }
}
