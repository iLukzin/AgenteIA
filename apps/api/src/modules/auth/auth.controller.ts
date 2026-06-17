import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Rota protegida normal — passa pelo TenantRlsInterceptor, então só
  // confirma os dados já presentes no token (não precisa ir ao banco).
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
