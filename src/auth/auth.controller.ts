import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBody } from '@nestjs/swagger'; 

@ApiTags('auth') 
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'admin' },
        password: { type: 'string', example: '123456' },
      },
    },
  })
  async register(@Body() body: any) {
    return this.authService.register(body.username, body.password);
  }

  @Post('login')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'admin' },
        password: { type: 'string', example: '123456' },
      },
    },
  })
  async login(@Body() body: any) {
    return this.authService.login(body.username, body.password);
  }
}