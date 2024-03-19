import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
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
    return this.chatService.createChat(createChatDTO);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':chatId/message')
  async addMessageToChat(@Param('chatId') chatId: string, @Body() createMessageDTO: CreateMessageDTO) {
    return this.chatService.addMessageToChat(new Types.ObjectId(chatId), createMessageDTO);
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
    return this.chatService.getChats(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:chatId')
  async deleteChat(@Param('chatId') chatId: string) {
    return this.chatService.deleteChat(chatId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:userId/notificationCount')
  async getNotificationCount(@Param('userId') userId: string) {
    return this.chatService.getNotificationCount(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:userId/updateNotificationCount')
  async updateNotificationCount(@Param('userId') userId: string, @Body('count') count: number) {
    await this.chatService.updateNotificationCount(userId, count);
    return { message: 'Notification count updated successfully' };
  }
}
