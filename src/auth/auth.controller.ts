import { Controller, Post, Body, UseGuards, Request, UsePipes, ValidationPipe, BadRequestException, UnauthorizedException, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { CreateUserDTO } from 'src/user/dtos/create-user.dto';
import { LocalAuthGuard } from 'src/auth/guards/local-auth.guard';
import { RefreshTokenDTO } from './dtos/fresh-token.dto';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('/register')
  @UsePipes(new ValidationPipe({
    transform: true,
    exceptionFactory: (errors) => {
      const formattedErrors = errors.reduce((acc, err) => {
        acc[err.property] = Object.values(err.constraints)[0]; // Taking the first error message for each field
        return acc;
      }, {});
      throw new BadRequestException({ errors: formattedErrors });
    }
  }))
  async register(@Body() createUserDTO: CreateUserDTO) {
    try {
      const user = await this.userService.createUser(createUserDTO);
      return user;
    } catch (error) {
      throw new BadRequestException('Error processing your request');
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string): Promise<{ message: string }> {
    await this.authService.handleForgotPassword(email);
    return { message: 'If your email address is registered with us, you will receive an email with a new password.' };
  }

  @Post('forgot-username')
  async forgotUserName(@Body('email') email: string): Promise<{ message: string }> {
    await this.authService.handleForgotUserName(email);
    return { message: 'If your email address is registered with us, you will receive an email with your username.' };
  }

  /*@Post('/refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(@Req() req: any, @Body() body: RefreshTokenDTO) {
    const user = req.user;
    const accessToken = await this.authService.createAccessToken(user);
    return { accessToken };
  }*/

  @Post('/refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDTO) {
    const { access_token, refresh_token } = await this.authService.refreshToken(refreshTokenDto.refreshToken);
    if (!access_token) {
      throw new UnauthorizedException();
    }
    return { access_token, refresh_token };
  }
}