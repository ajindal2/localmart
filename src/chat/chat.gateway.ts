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
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDTO } from './dtos/create-message.dto';
import { validate } from 'class-validator';
import { CreateChatDTO } from './dtos/create-chat.dto';
import { Types } from 'mongoose';
import { Chat } from './schemas/chat.schema';

@WebSocketGateway({
    //path: '/ws',
    cors: {
      origin: '*', // Allow any origin
    },
  })
  export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(private readonly chatService: ChatService) {}

    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('ChatGateway');

    @SubscribeMessage('testEvent')
    handleTestEvent(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log('Test event received:', data);
    client.emit('testResponse', { message: 'Test event received' });
    }

    @SubscribeMessage('createChat')
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
    }

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
            this.server.to(chat._id.toString()).emit('chat', chat.messages);
        } catch (error) {
            console.error('Error sending message', error);
            client.emit('error', 'Error sending message');
        }
    }

    @SubscribeMessage('getChats')
        async handleGetChats(client: Socket, userId: string): Promise<void> {
        try{
            const chats = await this.chatService.getChats(userId);
            client.emit('chatsToClient', chats);
        } catch (error) {
            console.error('Error fetching chats', error);
            client.emit('error', 'fetching chats');
        }
    }

    afterInit(server: Server) {
        this.logger.log('Init');
        console.log('Init');
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


interface CallbackResponse {
    success?: boolean;
    chat?: Chat; // Assuming 'Chat' is a defined type/interface for your chat object
    error?: string;
  }
/**
* In this code:

handleMessage is a method that listens to the ‘chatToServer’ event. When a message is sent from the client, it creates a new message in the chat and then emits the updated chat to the clients in the same room.
afterInit is a lifecycle hook that is called after the gateway has been initialized.

handleConnection is a lifecycle hook that is called when a client connects to the server. It joins the client to a room with the same ID as the chat.

handleDisconnect is a lifecycle hook that is called when a client disconnects from the server.

Please note that you need to handle any errors that might occur during the execution of your application. You can use exception filters in NestJS for this purpose. 
Also, don’t forget to validate the user inputs and handle any potential security issues. You can use class-validator and class-transformer libraries that are 
integrated with NestJS for input validation. For security, consider adding authentication and authorization mechanisms. You can use Passport.js which is a flexible 
and modular authentication middleware for Node.js. It can be dropped into any Express-based web application. A comprehensive set of strategies support authentication 
using a username and password, Facebook, Twitter, and more. NestJS has a dedicated module for it. You can also use Helmet, a collection of 14 smaller middleware 
functions that set HTTP response headers, and csurf for CSRF protection.

On the client side, you would use a library like socket.io-client to emit chatToServer events to the server and listen for chatToServer events from the server.

*/
  