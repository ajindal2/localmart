import { Controller, Delete, Param, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('account')
export class AccountController {
    constructor(private readonly accountService: AccountService) {}
    
    @UseGuards(JwtAuthGuard) 
    @Delete(':userId')
    async deleteAccount(@Param('userId') userId: string, @Req() req: Request) {
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
          
        await this.accountService.deleteAccount(userId);
        return { message: 'Account and related data deleted successfully' };
    }
}
