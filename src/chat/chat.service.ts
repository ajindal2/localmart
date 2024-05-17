import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Chat } from './schemas/chat.schema';
import { Message } from './schemas/message.schema';
import { CreateChatDTO } from './dtos/create-chat.dto';
import { CreateMessageDTO } from './dtos/create-message.dto';
import { User } from 'src/user/schemas/user.schema';
import axios from 'axios';
import { NotificationsCounter } from './schemas/notifications-counter.schema';
import { UserProfile } from 'src/userProfile/schemas/userProfile.schema';
import { LoggingService } from '../common/services/logging.service';


@Injectable()
export class ChatService {
  
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>, 
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
    @InjectModel(NotificationsCounter.name) private notificationsCounterModel: Model<NotificationsCounter>,
    private readonly loggingService: LoggingService) {
      this.loggingService.setContext(ChatService.name);
    }

  async createChat(createChatDTO: CreateChatDTO): Promise<Chat> {
    try {
      let chat = await this.chatModel.findOne(createChatDTO);
      if (!chat) {
        chat = new this.chatModel(createChatDTO);
        await chat.save();
        // Repopulate the newly saved chat with listing details
        chat = await this.chatModel.findById(chat._id)
        .populate({ path: 'listingId' }) // Populate listing object. This is needed on FE to redirect to Viewlisting whne user clicks on listing header in the chat screen.
        .populate({ path: 'sellerId', select: 'displayName' })
        .populate({ path: 'buyerId', select: 'displayName' }) 
        .populate({path: 'messages.senderId', select: 'displayName'})
      } else {
        // Ensure the chat is populated with listing details even if it already existed
        chat = await this.chatModel.findById(chat._id)
        .populate({ path: 'listingId' }) // Populate listing object. This is needed on FE to redirect to Viewlisting whne user clicks on listing header in the chat screen.
        .populate({ path: 'sellerId', select: 'displayName' })
        .populate({ path: 'buyerId', select: 'displayName' }) 
        .populate({path: 'messages.senderId', select: 'displayName'})
      }
      return chat.toObject(); // Convert the Mongoose document to a plain JavaScript object
    } catch (error) {
      this.loggingService.error(`Error creating chat for ${createChatDTO}`, error);
      throw new InternalServerErrorException('Error creating chat');
    }
  }

  async createSystemChat(buyerId: string, listingId: string): Promise<Chat> {

    try {
      const systemChatDTO: Partial<CreateChatDTO> = {
        sellerId: process.env.SYSTEM_USER_ID,
        buyerId: buyerId,
        listingId: listingId, // Use listingId as part of the query to ensure uniqueness for this buyer and listing
        isSystemMessage: true,
      };
  
      // Try to find an existing chat that matches the buyer, listing, and system seller
      let chat = await this.chatModel.findOne(systemChatDTO);
      if (!chat) {
        // If no existing chat is found, create a new one
        chat = new this.chatModel(systemChatDTO);
        await chat.save();
      }
  
      // Construct the message DTO for the system message
      const createMessageDTO: CreateMessageDTO = {
        senderId: process.env.SYSTEM_USER_ID,
        content: 'Please rate your experience with the seller. Click here to rate.',
        sentAt: new Date(), // Optional, can be omitted to use the default server timestamp
      };
  
      // Call addMessageToChat to add the system message to the chat. This will also send the notification to buyer.
      const updatedChat = await this.addMessageToChat(chat._id, createMessageDTO);
  
      return updatedChat;
    } catch (error) {
      this.loggingService.error(`Error creating chat for buyer ${buyerId} and listing ${listingId}`, error);
      throw new InternalServerErrorException('Error creating system chat');
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
      // De-deup the array of pushTokens 
      const uniquePushTokens = [...new Set(pushTokens)];

      // Send a push notification to each of the recipient's devices
      for (const pushToken of uniquePushTokens) {
        await this.sendPushNotification(pushToken, message.content, chatId.toString());
      }

      return chat;
    } catch (error) {
      this.loggingService.error(`Error creating chat for chatId ${chatId}`, error);
      throw new InternalServerErrorException('Error adding message to chat');
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
    } catch (error) {
      this.loggingService.error(`Error marking messages as read for chatId ${chatId} and userId ${userId}`, error);
      throw new InternalServerErrorException('Error marking messages as read');
    }
  }

  async getChats(userId: string): Promise<Chat[]> {
    try {
      const chats = await this.chatModel.find({
        $or: [{ sellerId: userId }, { buyerId: userId }],
      })
      .populate('listingId')
      .populate({ path: 'sellerId', select: 'displayName' })
      .populate({ path: 'buyerId', select: 'displayName' })
      .populate({path: 'messages.senderId', select: 'displayName'})
      .exec();
  
      if (!chats || chats.length === 0) {
        throw new NotFoundException(`No chats found for user with id ${userId}`);
      }

      const chatsWithUnread = chats.map(chat => {
        // Filter out messages that were sent by the userId and are unread
        const unreadMessages = chat.messages.filter(message => 
          !message.read && !message.senderId.equals(userId) // Assuming senderId is stored as ObjectId and populated
        );
        return {
          ...chat.toObject(),
          unreadCount: unreadMessages.length,
          lastMessageRead: unreadMessages.length === 0,
        };
      });
  
      return chatsWithUnread;
    } catch (error) {
      this.loggingService.error(`Error getting chats for user ${userId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred when getting chats');
      }
    }
  }

  // Not in use
  async getChat(chatId: string): Promise<Chat> {
    try {
      // Fetch chat by chatId
      const chat = await this.chatModel.findById(chatId)
      .populate({ path: 'listingId' }) // Populate listing object
      .populate({ path: 'sellerId', select: 'displayName' }) // Populate seller details
      .populate({ path: 'buyerId', select: 'displayName' }) // Populate buyer details
      .populate({path: 'messages.senderId', select: 'displayName'})
      .exec();
  
      if (!chat) {
        throw new NotFoundException(`No chat found with id ${chatId}`);
      }
      return chat;
    } catch (error) {
      console.error(`Error deleting chat for chatId ${chatId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else {
        throw new HttpException('Error getting chat', HttpStatus.INTERNAL_SERVER_ERROR);
      }
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
      this.loggingService.error(`Error deleting chat ${chatId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  async getBuyersForListing(listingId: string, sellerId: string): Promise<any[]> {
    try {
      const chats = await this.chatModel.find({
        listingId: listingId,
        sellerId: sellerId,
      })
      .populate({ path: 'buyerId', select: 'displayName' }) // Populate buyerId to get displayName
      .exec();

      // Map over the chats to extract buyer information with profile picture
      const buyersInfo = await Promise.all(chats.map(async chat => {

      if (chat && chat.buyerId && 'displayName' in chat.buyerId) {
        // Fetch UserProfile for the populated buyerId
        const userProfile = await this.userProfileModel.findOne({ userId: chat.buyerId._id }).exec();
        if (!userProfile) {
          throw new Error(`UserProfile not found for buyerId ${chat.buyerId._id}`);
        }
    
        return {
          buyerId: chat.buyerId._id,
          displayName: chat.buyerId.displayName,
          profilePicture: userProfile.profilePicture,
        };
      } else  {
        throw new Error('Buyer information could not be retrieved.');
      }
    }));
  
    return buyersInfo;
    } catch (error) {
      this.loggingService.error(`Error fetching buyer details for listing ${listingId} and seller ${sellerId}`, error);
      if (error.name === 'NotFoundException' || error.name === 'BadRequestException') {
        throw error;
      } else {
        throw new HttpException('Error fetching buyer details', HttpStatus.INTERNAL_SERVER_ERROR);
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
      this.loggingService.error(`Error getting notification count for user ${userId}`, error);
      return 0;
    }
  }

  async updateNotificationCount(userId: string, count: number): Promise<void> {
    try {
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
    } catch (error) {
      this.loggingService.error(`Error updating notification count for user ${userId}`, error);
      //throw new InternalServerErrorException('Error updating notification count');
    }
  }

  async sendPushNotification(pushToken: string, messageContent: string, chatId: string) {
    try {
      const notification = {
        to: pushToken,
        sound: 'default',
        title: 'New Message',
        contentAvailable: true, // For iOS
        priority: 'high', // For Android
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
    } catch (error) {
      this.loggingService.error(`Error sending push notification for pushToken ${pushToken} and chatId ${chatId}`, error);
      //throw new InternalServerErrorException('Error updating notification count');
    }
  } 
}
