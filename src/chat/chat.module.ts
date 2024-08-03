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
import { BlockUserModule } from 'src/block-user/block-user.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Message', schema: MessageSchema },
      { name: 'Chat', schema: ChatSchema },
      { name: 'User', schema: UserSchema },
      { name: 'NotificationsCounter', schema: NotificationsCounterSchema }, 
      { name: 'UserProfile', schema: UserProfile },
    ]),
    BlockUserModule,
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController]
})
export class ChatModule {}
