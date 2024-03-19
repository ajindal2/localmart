import { Body, Controller, Get, NotFoundException, Param, Put, Post, Delete, UseGuards, UsePipes, ValidationPipe, Res, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { CreateUserDTO } from './dtos/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/:userId')
  @UseGuards(JwtAuthGuard)
  async getUser(@Param('userId') userId: string) {
    const user = await this.userService.findByUserId(userId);
    if (!user) throw new NotFoundException('User does not exist!');
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDTO) {
    return this.userService.updateById(id, updateUserDto);
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
    // Send a response body
    response.status(HttpStatus.OK).json(user);
  }
}