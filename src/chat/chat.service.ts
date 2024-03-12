import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat } from './schemas/chat.schema';
import { Message } from './schemas/message.schema';
import { CreateChatDTO } from './dtos/create-chat.dto';
import { CreateMessageDTO } from './dtos/create-message.dto';
import { User } from 'src/user/schemas/user.schema';
import axios from 'axios';
import { NotificationsCounter } from './schemas/notifications-counter.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>, 
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(NotificationsCounter.name) private notificationsCounterModel: Model<NotificationsCounter>
  ) {}

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
      } else {
        // Ensure the chat is populated with listing details even if it already existed
        chat = await this.chatModel.findById(chat._id)
        .populate({ path: 'listingId' }) // Populate listing object. This is needed on FE to redirect to Viewlisting whne user clicks on listing header in the chat screen.
        .populate({ path: 'sellerId', select: 'userName' })
          .populate({ path: 'buyerId', select: 'userName' }) 
          .populate({path: 'messages.senderId', select: 'userName'})
      }
      return chat.toObject(); // Convert the Mongoose document to a plain JavaScript object
    } catch (error) {
      throw new HttpException('Error creating chat', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addMessageToChat(chatId: Types.ObjectId, createMessageDTO: CreateMessageDTO): Promise<Chat> {
    try {
      const message = new this.messageModel(createMessageDTO);
      await this.chatModel.updateOne(
        { _id: chatId },
        { $push: { messages: message } }
      );

      // Get the chat document
      const chat = await this.chatModel.findOne(chatId).exec();

      // Get the recipient's ID
      const recipientId = chat.sellerId.equals(message.senderId) ? chat.buyerId : chat.sellerId;

      // Get the recipient's push tokens
      const recipient = await this.userModel.findById(recipientId).exec();
      const pushTokens = recipient.pushTokens;

      // increment the notifications count for the recipient
      const notificationsCounter = await this.notificationsCounterModel.findOne({ userId: recipientId }).exec();

      if (notificationsCounter) {
        // If the document exists, increment the count
        await notificationsCounter.updateOne({ $inc: { unreadNotificationCount: 1 } }).exec();
      } else {
        // If no document exists for this user, create a new one
        const newCounter = new this.notificationsCounterModel({
          userId: recipientId,
          unreadNotificationCount: 1 // Start the count at 1
        });
        await newCounter.save();
      }

      // Send a push notification to each of the recipient's devices
      for (const pushToken of pushTokens) {
        await this.sendPushNotification(pushToken, message.content, chatId.toString());
      }

      return chat;
    } catch (error) {
      throw new HttpException('Error adding message to chat', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async markMessagesAsRead(chatId: string, userId:string): Promise<void> {
    try {
      const result = await this.chatModel.updateOne(
        { _id: chatId }, // filter to identify the specific chat
        { $set: { "messages.$[elem].read": true } }, // update the read field in each message
        { 
          multi: true, // apply this update to all documents that match the filter
          arrayFilters: [{ "elem.senderId": { $ne: userId }, "elem.read": false }] // Exclude messages sent by the current user. when a user opens a chat, only the messages sent to them (and not by them) are marked as read
        }
      );

      //console.log('Unread messages in chat', chatId, 'marked as read for user', userId);
  
      if (result.modifiedCount === 0) {
        console.log('No unread messages to update or chat not found');
      } else {
        console.log(`${result.modifiedCount} messages marked as read in chat ${chatId}`);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new HttpException('Error marking messages as read', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getChats(userId: string): Promise<Chat[]> {
    try {
      const chats = await this.chatModel.find({
        $or: [{ sellerId: userId }, { buyerId: userId }],
      })
      .populate('listingId')
      .populate({ path: 'sellerId', select: 'userName' })
      .populate({ path: 'buyerId', select: 'userName' })
      .populate({path: 'messages.senderId', select: 'userName'})
      .exec();
  
      if (!chats || chats.length === 0) {
        throw new NotFoundException(`No chats found for user with id ${userId}`);
      }

      /*chats.forEach((chat, chatIndex) => {
        console.log(`Chat ${chatIndex + 1}:`, chat); // Log the chat object itself

        // If the chat has messages, iterate over them
        if (chat.messages && chat.messages.length > 0) {
          chat.messages.forEach((message, messageIndex) => {
            console.log(`Message ${messageIndex + 1} in Chat ${chatIndex + 1}:`, message);
          });
        } else {
          console.log(`Chat ${chatIndex + 1} has no messages.`);
        }
      });*/
  
      // Calculate unread messages for each chat
      const chatsWithUnread = chats.map(chat => {
        const unreadMessages = chat.messages.filter(message => !message.read);
        return {
          ...chat.toObject(),
          unreadCount: unreadMessages.length,
          lastMessageRead: unreadMessages.length === 0, //|| unreadMessages[0]._id.toString() !== chat.messages[chat.messages.length - 1]._id.toString(),
        };
      });
  
      //console.log('chatsWithUnread: ', chatsWithUnread);
      return chatsWithUnread;
    } catch (error) {
      throw new HttpException('Error getting chats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getChat(chatId: string): Promise<Chat> {
    try {
      // Fetch chat by chatId
      const chat = await this.chatModel.findById(chatId)
      .populate({ path: 'listingId' }) // Populate listing object
      .populate({ path: 'sellerId', select: 'userName' }) // Populate seller details
      .populate({ path: 'buyerId', select: 'userName' }) // Populate buyer details
      .populate({path: 'messages.senderId', select: 'userName'})
      .exec();
  
      if (!chat) {
        throw new NotFoundException(`No chat found with id ${chatId}`);
      }
      return chat;
    } catch (error) {
      throw new HttpException('Error getting chat', HttpStatus.INTERNAL_SERVER_ERROR);
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

  async getNotificationCount(userId: string): Promise<number> {
    try {
      const notificationsCounter = await this.notificationsCounterModel.findOne({ userId: userId }).exec();
      if (!notificationsCounter) {
        return 0; // Return 0 if no document exists for this user
      }
      return notificationsCounter.unreadNotificationCount;
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }

  async updateNotificationCount(userId: string, count: number): Promise<void> {
    const notificationsCounter = await this.notificationsCounterModel.findOne({ userId: userId }).exec();
  
    if (notificationsCounter) {
      // Document exists, update it
      await this.notificationsCounterModel.findByIdAndUpdate(notificationsCounter._id, { $set: { unreadNotificationCount: count } }).exec();
    } else {
      // Document doesn't exist, create a new one
      const newCounter = new this.notificationsCounterModel({
        userId: userId,
        unreadNotificationCount: count
      });
      await newCounter.save();
    }
  
   // console.log(`Notification count updated for user ${userId} to ${count}`);
  }

  async sendPushNotification(pushToken: string, messageContent: string, chatId: string) {

    const notification = {
      to: pushToken,
      sound: 'default',
      title: 'New Message',
      //contentAvailable: true, // For iOS
      //priority: 'high', // For Android
      body: messageContent,
      data: { 
        type: 'NEW_MESSAGE',
        chatId: chatId,
        message: messageContent,
      },
    };

    await axios.post('https://exp.host/--/api/v2/push/send', notification, {
      headers: {
        'host': 'exp.host',
        'accept': 'application/json',
        'accept-encoding': 'gzip, deflate',
        'content-type': 'application/json',
      },
    });
  }
}
