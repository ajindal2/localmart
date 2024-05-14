import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayInit,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDTO } from './dtos/create-message.dto';
import { validate } from 'class-validator';
import { CreateChatDTO } from './dtos/create-chat.dto';
import { Types } from 'mongoose';
import { Chat } from './schemas/chat.schema';


@WebSocketGateway({
    cors: {
      origin: '*', // Allow any origin
    },
  })
  export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(private readonly chatService: ChatService) {}

    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('ChatGateway');

    /*@SubscribeMessage('createChat')
    async handleCreateChatEvent(@MessageBody() createChatDTO: CreateChatDTO, @ConnectedSocket() client: Socket): Promise<void> {
        try {
            const errors = await validate(createChatDTO);
            if (errors.length > 0) {
                client.emit('error', 'Invalid message payload');
                return;
            }
            const chat = await this.chatService.createChat(createChatDTO);
            client.emit('chatCreated', chat); // Emit the created chat object back to the client
            //callback({ success: true, chat });
            client.join(chat._id.toString()); // Join a room with the chat's ID
        } catch (error) {
            console.error('Error creating chat', error);
            client.emit('error', 'Error creating chat');
            //callback({ error: 'Error creating chat' }); // Send back error
        }
    }*/

    //@UseGuards(WsJwtGuard) 
    @SubscribeMessage('chat')
    async handleChatEvent(@MessageBody() payload: { createMessageDTO: CreateMessageDTO, chatId: string }, @ConnectedSocket() client: Socket): Promise<void> {
        const { createMessageDTO, chatId } = payload;

        try {
            const errors = await validate(createMessageDTO);
            if (errors.length > 0) {
                client.emit('error', 'Invalid message payload');
                return;
            }
            const chat = await this.chatService.addMessageToChat(new Types.ObjectId(chatId), createMessageDTO);
            // Include senderId in the message
            const messageToSend = {
                ...chat.messages[chat.messages.length - 1],
                senderId: client.id // or any other identifier you use for the user
            };
            this.server.to(chat._id.toString()).emit('messageRcvd', [messageToSend]);
            //this.server.to(chat._id.toString()).emit('messageRcvd', chat.messages);
        } catch (error) {
            console.error('Error sending message', error);
            client.emit('error', 'Error sending message');
        }
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
        //console.log(`Client ${client.id} joined room: ${chatId}`);
        client.join(chatId);
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
      //console.log(`Client ${client.id} left room: ${chatId}`);
      client.leave(chatId);
    }

    /*@SubscribeMessage('getChats')
    async handleGetChats(client: Socket, userId: string): Promise<void> {
    try{
        const chats = await this.chatService.getChats(userId);
        client.emit('chatsToClient', chats);
    } catch (error) {
        console.error('Error fetching chats', error);
        client.emit('error', 'fetching chats');
        }
    }

    @SubscribeMessage('getChat')
    async handleGetChat(client: Socket, chatId: string): Promise<void> {
    try {
        const chat = await this.chatService.getChat(chatId);
        client.emit('chatToClient', chat);
    } catch (error) {
        console.error('Error fetching chat', error);
        client.emit('error', 'fetching chat');
    }
    }*/

    afterInit(server: Server) {
        this.logger.log('Init');
        //console.log('Init');
    }

    handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`Client connected: ${client.id}`);
        console.log(`Client connected: ${client.id}`);
        //client.join(client.handshake.query['chatId']);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        console.log(`Client disconnected: ${client.id}`);
    }
}

  