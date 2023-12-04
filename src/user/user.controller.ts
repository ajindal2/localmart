import { Body, Controller, Get, NotFoundException, Param, Put, Post, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { CreateUserDTO } from './dtos/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/:userId')
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

 /*@Delete('/delete/:username')
  async deleteUser(@Param('username') userName: string) {
    try {
      const userWithId = await this.userService.findByUsername(userName);
      if (!userWithId) {
        throw new NotFoundException('User name ${userName} not found');
      }
      await this.userService.deleteById(userWithId._id);
      // TODO see what should return if delete is succesful
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e;
      }
      // Handle or log the error
      throw new NotFoundException(`Could not update the user ${userName}`);
    }
  }*/

  @Post('/')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUser(@Body() createUserDto: CreateUserDTO) {
    // Incoming data is validated against CreateUserDto
    const user = await this.userService.createUser(createUserDto);
    return user;
  }
}