import { Controller } from '@nestjs/common';
import { Post, Body } from '@nestjs/common';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService){}

    @Post("signup")
    async signup(@Body() body: SignupDto){
        return await this.authService.signup(body);
    }
    
    
    
}
