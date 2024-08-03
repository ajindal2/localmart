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
import { ChatService } from './chat.service';
import { BlockUserService } from '../block-user/block-user.service';
import { CreateMessageDTO } from './dtos/create-message.dto';
import { validate } from 'class-validator';
import { Types } from 'mongoose';
import { Logger } from '@nestjs/common';


@WebSocketGateway({
    cors: {
      origin: '*', // Allow any origin. It is safe since CORS is not an issue for React native apps.
    },
  })
  export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly chatService: ChatService,
        private readonly blockUserService: BlockUserService
        ) {}

    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('ChatGateway');

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

            // Retrieve the chat and ensure it exists
            const fetchedChat = await this.chatService.findChatById(new Types.ObjectId(chatId));
            if (fetchedChat) {

                // Determine the recipientId based on the chat participants
                const { senderId } = createMessageDTO;
                let recipientId: Types.ObjectId;

                if (fetchedChat.sellerId.equals(senderId)) {
                    recipientId = fetchedChat.buyerId;
                } else if (fetchedChat.buyerId.equals(senderId)) {
                    recipientId = fetchedChat.sellerId;
                } else {
                    client.emit('error', 'Sender is not a participant of this chat');
                    return;
                }

                // Check if the sender is blocked by the recipient
                const isBlocked = await this.blockUserService.isUserBlocked(recipientId.toString(), senderId);
                
                if (isBlocked) {
                    console.log(`Blocked sender ${senderId} trying to message recipient ${recipientId}`);
                    //client.emit('error', 'You are blocked from sending messages to this user');
                    return;
                }
            }

            const chat = await this.chatService.addMessageToChat(new Types.ObjectId(chatId), createMessageDTO);
            // Include senderId in the message
            const messageToSend = {
                messages: chat.messages,
                senderId: createMessageDTO.senderId 
            };
            this.server.to(chat._id.toString()).emit('messageRcvd', messageToSend);
        } catch (error) {
            this.logger.error(`Error sending message for chatId ${chatId}`, error);
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
        //this.logger.log('Init');
        //console.log('Init');
    }

    handleConnection(client: Socket, ...args: any[]) {
       // this.loggingService.log(`Client connected: ${client.id}}`);
        //client.join(client.handshake.query['chatId']);
    }

    handleDisconnect(client: Socket) {
        //this.loggingService.log(`Client disconnected: ${client.id}`);
    }
}

  