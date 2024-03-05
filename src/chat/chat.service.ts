import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateChatDTO } from './dtos/create-chat.dto';
import { CreateMessageDTO } from './dtos/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>, 
    @InjectModel(Message.name) private messageModel: Model<Message>
  ) {}

  async createChat(createChatDTO: CreateChatDTO): Promise<Chat> {
    try {
      let chat = await this.chatModel.findOne(createChatDTO).exec();
      if (!chat) {
        chat = new this.chatModel(createChatDTO);
        await chat.save();
      } 
      return chat;
    } catch (error) {
      throw new HttpException('Error creating chat', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  async addMessageToChat(chatId: Types.ObjectId, createMessageDTO: CreateMessageDTO): Promise<Chat> {
    try {
      const message = new this.messageModel(createMessageDTO);
      console.log('message to be added: ', message);
      await this.chatModel.updateOne(
        { _id: chatId },
        { $push: { messages: message } }
      );
      return this.chatModel.findOne(chatId).exec();
      } catch (error) {
        throw new HttpException('Error adding message to chat', HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }

  /*async getChats(userId: string): Promise<Chat[]> {
    try {
      const chats = await this.chatModel.find({
        $or: [{ sellerId: userId }, { buyerId: userId }],
      }).exec();
      if (!chats) {
        throw new NotFoundException(`No chats found for user with id ${userId}`);
      }
      return chats;
    } catch (error) {
      throw new HttpException('Error getting chat', HttpStatus.INTERNAL_SERVER_ERROR);

    }
  }*/

  async getChats(userId: string): Promise<Chat[]> {
    try {
      // Fetch chats where the current user is either the seller or the buyer
      const chats = await this.chatModel.find({
        $or: [{ sellerId: userId }, { buyerId: userId }],
      })
      .populate({ path: 'listingId', select: 'title imageUrls' }) // Populate listing details
      .populate({ path: 'sellerId', select: 'userName', match: { _id: { $ne: userId } } }) // Populate seller details excluding the current user
      .populate({ path: 'buyerId', select: 'userName', match: { _id: { $ne: userId } } }) // Populate buyer details excluding the current user
      .sort({ 'messages.sentAt': -1 }) // Sort by the latest message's timestamp
      .exec();
  
      if (!chats || chats.length === 0) {
        throw new NotFoundException(`No chats found for user with id ${userId}`);
      }

      console.log('chats before getting last message: ', chats);
  
      // Optionally, transform the chat documents to include only the last message from each chat
      const chatsWithLastMessage = chats.map(chat => ({
        ...chat.toObject(),
        messages: [chat.messages[chat.messages.length - 1]], // Include only the last message
      }));
  
      console.log('chats after getting last message: ', chatsWithLastMessage);
      return chats;
    } catch (error) {
      throw new HttpException('Error getting chats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
