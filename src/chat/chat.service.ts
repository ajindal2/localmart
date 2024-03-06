import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

  /*async createChat(createChatDTO: CreateChatDTO): Promise<Chat> {
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
  }*/

  async createChat(createChatDTO: CreateChatDTO): Promise<Chat> {
    try {
      let chat = await this.chatModel.findOne(createChatDTO);
      if (!chat) {
        chat = new this.chatModel(createChatDTO);
        await chat.save();
        // Repopulate the newly saved chat with listing details
        chat = await this.chatModel.findById(chat._id)
        .populate({ path: 'listingId' }) // Populate listing object. This is needed on FE to redirect to Viewlisting whne user clicks on listing header in the chat screen.
        .populate({ path: 'sellerId', select: 'userName' })
          .populate({ path: 'buyerId', select: 'userName' }) 
          .populate({path: 'messages.senderId', select: 'userName'})
          //.sort({ 'messages.sentAt': -1 });
      } else {
        // Ensure the chat is populated with listing details even if it already existed
        chat = await this.chatModel.findById(chat._id)
        .populate({ path: 'listingId' }) // Populate listing object. This is needed on FE to redirect to Viewlisting whne user clicks on listing header in the chat screen.
        .populate({ path: 'sellerId', select: 'userName' })
          .populate({ path: 'buyerId', select: 'userName' }) 
          .populate({path: 'messages.senderId', select: 'userName'})
          //.sort({ 'messages.sentAt': -1 });
      }
      console.log('chat in createChat: ', chat);
      return chat.toObject(); // Convert the Mongoose document to a plain JavaScript object
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

  async getChats(userId: string): Promise<Chat[]> {
    try {
      // Fetch chats where the current user is either the seller or the buyer
      const chats = await this.chatModel.find({
        $or: [{ sellerId: userId }, { buyerId: userId }],
      })
      .populate({ path: 'listingId' }) // Populate listing object. This is needed on FE to redirect to Viewlisting whne user clicks on listing header in the chat screen.
      .populate({ path: 'sellerId', select: 'userName', match: { _id: { $ne: userId } } }) // Populate seller details excluding the current user
      .populate({ path: 'buyerId', select: 'userName', match: { _id: { $ne: userId } } }) // Populate buyer details excluding the current user
      .populate({path: 'messages.senderId', select: 'userName'})
      //.sort({ 'messages.sentAt': -1 }) // Sort by the latest message's timestamp
      .exec();
  
      if (!chats || chats.length === 0) {
        throw new NotFoundException(`No chats found for user with id ${userId}`);
      }

      // Iterating over each chat
      /*chats.forEach((chat, chatIndex) => {
        console.log(`Chat ${chatIndex + 1}:`, chat); // Log the chat object itself

        // If the chat has messages, iterate over them
        if (chat.messages && chat.messages.length > 0) {
          chat.messages.forEach((message, messageIndex) => {
            console.log(`Message ${messageIndex + 1} in Chat ${chatIndex + 1}:`, message);

            // Log specific details of the message, like content and sender's userName
            console.log(`Content: ${message.content}, Sender: ${message.senderId}`);
          });
        } else {
          console.log(`Chat ${chatIndex + 1} has no messages.`);
        }
      });*/

      return chats;
    } catch (error) {
      throw new HttpException('Error getting chats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    try {
      const result = await this.chatModel.deleteOne({ _id: chatId }).exec();
      if (result.deletedCount === 0) {
        console.error(`Chat with ID "${chatId}" not found`);
        throw new NotFoundException(`Chat not found`);
      }
    } catch (error) {
      console.error(`Error deleting chat ${chatId}`, error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('DB validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }
}
