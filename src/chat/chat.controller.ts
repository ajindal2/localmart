import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDTO } from './dtos/create-chat.dto';
import { CreateMessageDTO } from './dtos/create-message.dto';
import { Types } from 'mongoose';
import { MarkAsReadDto } from './dtos/mark-as-read.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(@Body() createChatDTO: CreateChatDTO) {
    return this.chatService.createChat(createChatDTO);
  }

  @Post(':chatId/message')
  async addMessageToChat(@Param('chatId') chatId: string, @Body() createMessageDTO: CreateMessageDTO) {
    return this.chatService.addMessageToChat(new Types.ObjectId(chatId), createMessageDTO);
  }

  @Post('/markAsRead')
  async markChatMessagesAsRead(@Body() body: MarkAsReadDto) {
    const { chatId, userId } = body;
    await this.chatService.markMessagesAsRead(chatId, userId);
    return { message: 'Messages marked as read' };
  }

  @Get('/:userId')
  async getChats(@Param('userId') userId: string) {
    return this.chatService.getChats(userId);
  }

  @Delete('/:chatId')
  async deleteChat(@Param('chatId') chatId: string) {
    return this.chatService.deleteChat(chatId);
  }

  @Get('/:userId/notificationCount')
  async getNotificationCount(@Param('userId') userId: string) {
    return this.chatService.getNotificationCount(userId);
  }

  @Post('/:userId/updateNotificationCount')
  async updateNotificationCount(@Param('userId') userId: string, @Body('count') count: number) {
    await this.chatService.updateNotificationCount(userId, count);
    return { message: 'Notification count updated successfully' };
  }
}
