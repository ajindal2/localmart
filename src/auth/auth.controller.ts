import { Controller, Post, Body, Res, HttpStatus, UseGuards, Request, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { CreateUserDTO } from 'src/user/dtos/create-user.dto';
import { LocalAuthGuard } from 'src/auth/guards/local-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { RefreshTokenDTO } from './dtos/refresh-token.dto';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }


  /*@Post('/register')
  async register(@Body() createUserDto: CreateUserDTO) {
    const result = await this.authService.register(createUserDto);
    const { user, token } = result;

    return {
      username: user.userName,
      email: user.emailAddress,
      token,
    };
  }*/

  @Post('/register')
  async register(@Body() createUserDTO: CreateUserDTO) {
    const user = await this.userService.createUser(createUserDTO);
    return user;
  }

  @Post('/refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(@Req() req: any, @Body() body: RefreshTokenDTO) {
    const user = req.user;
    const accessToken = await this.authService.createAccessToken(user);
    return { accessToken };
  }
}