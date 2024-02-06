import { Controller, Post, Body, Res, HttpStatus, UseGuards, Request, Req, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
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

  @Post('/refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(@Req() req: any, @Body() body: RefreshTokenDTO) {
    const user = req.user;
    const accessToken = await this.authService.createAccessToken(user);
    return { accessToken };
  }
}