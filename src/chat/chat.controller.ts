import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDTO } from './dtos/create-chat.dto';
import { CreateMessageDTO } from './dtos/create-message.dto';
import { Types } from 'mongoose';
import { MarkAsReadDto } from './dtos/mark-as-read.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createChat(@Body() createChatDTO: CreateChatDTO) {
      return await this.chatService.createChat(createChatDTO);
  }

  // To send create a message and send notification to buyer to rate the seller.
  @UseGuards(JwtAuthGuard)
  @Post('/create-system-chat')
  @HttpCode(HttpStatus.OK)
  async createSystemChat(@Body('buyerId') buyerId: string, @Body('listingId') listingId: string,) {
    // Call the service method to create or find the system chat and add the system message
    const chat = await this.chatService.createSystemChat(buyerId, listingId);
    return chat;
  }
  
  @UseGuards(JwtAuthGuard)
  @Post(':chatId/message')
  async addMessageToChat(@Param('chatId') chatId: string, @Body() createMessageDTO: CreateMessageDTO) {
    return await this.chatService.addMessageToChat(new Types.ObjectId(chatId), createMessageDTO);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/markAsRead')
  async markChatMessagesAsRead(@Body() body: MarkAsReadDto) {
    const { chatId, userId } = body;
    await this.chatService.markMessagesAsRead(chatId, userId);
    return { message: 'Messages marked as read' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:userId')
  async getChats(@Param('userId') userId: string) {
    return await this.chatService.getChats(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:chatId')
  async deleteChat(@Param('chatId') chatId: string) {
    return await this.chatService.deleteChat(chatId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:userId/notificationCount')
  async getNotificationCount(@Param('userId') userId: string) {
    return await this.chatService.getNotificationCount(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:userId/updateNotificationCount')
  async updateNotificationCount(@Param('userId') userId: string, @Body('count') count: number) {
    await this.chatService.updateNotificationCount(userId, count);
    return { message: 'Notification count updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/buyer-info/:listingId/:sellerId')
  async getBuyerInfoByListingIdAndSellerId(@Param('listingId') listingId: string, @Param('sellerId') sellerId: string) {
    return await this.chatService.getBuyersForListing(listingId, sellerId);
  }
}
