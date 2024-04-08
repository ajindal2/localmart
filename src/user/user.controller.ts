import { Body, Controller, Get, NotFoundException, Param, Put, Post, Req, UseGuards, UsePipes, ValidationPipe, Res, HttpStatus, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { CreateUserDTO } from './dtos/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdatePasswordDTO } from './dtos/update-password.dto';
import { Request } from 'express';


@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }
  
  @Get('/:userId')
  @UseGuards(JwtAuthGuard)
  async getUser(@Param('userId') userId: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    // Extract userId and check if it exists
    const userIdFromReq = req.user['userId']; 
    if (!userIdFromReq) {
      throw new UnauthorizedException('User ID not found in request');
    }

    // Extra layer of validation to ensure the userId from the params matches the one from the token
    if (userIdFromReq !== userId) {
      throw new UnauthorizedException('User is not authorized');
    }

    const user = await this.userService.findByUserId(userId);
    if (!user) throw new NotFoundException('User does not exist!');
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDTO, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    // Extract userId and check if it exists
    const userIdFromReq = req.user['userId']; 
    if (!userIdFromReq) {
      throw new UnauthorizedException('User ID not found in request');
    }

    // Extra layer of validation to ensure the userId from the params matches the one from the token
    if (userIdFromReq !== id) {
      throw new UnauthorizedException('User is not authorized');
    }

    return await this.userService.updateById(id, updateUserDto);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUser(@Body() createUserDto: CreateUserDTO) {
    // Incoming data is validated against CreateUserDto
    const user = await this.userService.createUser(createUserDto);
    return user;
  }

  @Post(':id/pushToken')
  async updatePushToken(@Param('id') id: string, @Body('token') token: string, @Res() response) {
    const user = await this.userService.updatePushToken(id, token);    
    response.status(HttpStatus.OK).json(user);
  }

  @Post(':id/updatePassword')
  @UseGuards(JwtAuthGuard) 
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
  async updatePassword(@Param('id') userId: string, @Body() updatePasswordDto: UpdatePasswordDTO, @Req() req: Request) {

    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    // Extract userId and check if it exists
    const userIdFromReq = req.user['userId']; 
    if (!userIdFromReq) {
      throw new UnauthorizedException('User ID not found in request');
    }

    // Extra layer of validation to ensure the userId from the params matches the one from the token
    if (userIdFromReq !== userId) {
      throw new UnauthorizedException('User is not authorized');
    }

    return await this.userService.updatePassword(userId, updatePasswordDto);
  }
}