import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDTO } from './dtos/create-chat.dto';
import { CreateMessageDTO } from './dtos/create-message.dto';
import { Types } from 'mongoose';

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

  @Get(':userId')
  async getChats(@Param('userId') userId: string) {
    return this.chatService.getChats(userId);
  }
}
