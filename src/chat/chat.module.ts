import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageSchema } from './schemas/message.schema';
import { ChatSchema } from './schemas/chat.schema';
import { ChatGateway } from './chat.gateway';
import { UserSchema } from 'src/user/schemas/user.schema';
import { NotificationsCounterSchema } from './schemas/notifications-counter.schema';
import { UserProfile } from 'src/userProfile/schemas/userProfile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Message', schema: MessageSchema },
      { name: 'Chat', schema: ChatSchema },
      { name: 'User', schema: UserSchema },
      { name: 'NotificationsCounter', schema: NotificationsCounterSchema }, 
      { name: 'UserProfile', schema: UserProfile },
    ])
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController]
})
export class ChatModule {}
