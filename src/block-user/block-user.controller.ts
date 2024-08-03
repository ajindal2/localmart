import { Controller, Post, Delete, Get, Param, Req, UseGuards, UnauthorizedException, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BlockUserService } from './block-user.service';
import { Request } from 'express';
import { BlockUserDto } from './dtos/block-user.dto';


@Controller('block-user')
export class BlockUserController {
  constructor(private readonly blockUserService: BlockUserService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/')
  async blockUser(@Body() blockUserDto: BlockUserDto, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    const blockerId = req.user['userId'];
    if (!blockerId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    // Validate that the blockerId matches the authenticated user
    if (blockerId !== blockUserDto.blockerId) {
      throw new UnauthorizedException('You are not authorized to perform this action');
    }

    // Prevent blocking oneself
    if (blockUserDto.blockerId === blockUserDto.blockedId) {
      throw new UnauthorizedException('You cannot block yourself');
    }

    await this.blockUserService.blockUser(blockUserDto.blockerId, blockUserDto.blockedId);
    return { message: 'User blocked successfully' };
  }

  // Endpoint to check if a user is blocked
  @UseGuards(JwtAuthGuard)
  @Get('/:blockedId/status')
  async isBlocked(@Param('blockedId') blockedId: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    const blockerId = req.user['userId'];
    if (!blockerId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    const isBlocked = await this.blockUserService.isUserBlocked(blockerId, blockedId);
    return { isBlocked };
  }
}
