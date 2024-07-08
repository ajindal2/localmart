import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from './schemas/refresh-token.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { randomBytes } from 'crypto';
import { MailerService } from '@nestjs-modules/mailer'; 


@Injectable()
export class AuthService {
  constructor(
    @InjectModel('RefreshToken') 
    private readonly refreshTokenModel: Model<RefreshToken>,
    private userService: UserService,
    private jwtService: JwtService,
    private mailerService: MailerService
  ) {}

  private logger: Logger = new Logger('AuthService');

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if(user) {
      const isPasswordMatch = await bcrypt.compare(
        password,
        user.password
      );
      if(isPasswordMatch) {
        return user;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.emailAddress, userId: user._id };
    const refreshToken = await this.createRefreshToken(user);

    return {
      user: {
        _id: user._id,
        email: user.emailAddress,
      },
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
    };
  }

  async handleForgotPassword(email: string): Promise<void> {
    try {
      const user = await this.userService.findByEmail(email);
      
      if (!user) {
        // Log the event and silently fail to prevent email enumeration
        this.logger.error(`Forgot password attempted for non-existent email: ${email}`);
        return;
      }

      const newPassword = this.generatePassword(); 
      await this.userService.updateSystemPassword(user._id, newPassword); 

      await this.mailerService.sendMail({
        to: email,
        from: 'support@farmvox.com',
        subject: 'Your new password',
        template: 'password-reset',
        context: {
          password: newPassword,
        },
      }).catch((mailError) => {
        this.logger.error(`Error sending forgot password email to ${email}`, mailError);
      });
    } catch (error) {
      this.logger.error(`Error sending forgot password email to ${email}`, error);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
  
  async sendContactUsMail(email: string, subject: string, message: string, attachment?: Express.Multer.File): Promise<void> {
    try {
      const mailOptions = {
        to: 'support@farmvox.com', 
        subject: subject,
        template: 'contact-us',
        context: {
            subject: subject,
            message: message,
            email: email
        },
        //text: message,
        attachments: attachment ? [{
          filename: attachment.originalname,
          content: attachment.buffer,
        }] : [],
      };

      await this.mailerService.sendMail(mailOptions).catch((mailError) => {
        this.logger.error(`Error sending contact us email from ${email}, subject ${subject}, message ${message}`, mailError);
      });
    } catch (error) {
      this.logger.error(`Error sending contact us email from ${email}, subject ${subject}, message ${message}`, error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  private generatePassword(): string {
    return randomBytes(4).toString('hex'); // Generates a 8-character hexadecimal string
  }

  async createAccessToken(user: any): Promise<string> {
    return this.jwtService.sign({ userId: user._id, email: user.emailAddress });
  }

  private async createRefreshToken(user: any): Promise<string> {
    try {
      // Set the expiry to 30 days.
      const refreshToken = this.jwtService.sign({ userId: user._id }, { expiresIn: '30d' });
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // Set expiry date 30 days from now

      const refreshTokenDocument = new this.refreshTokenModel({
        token: refreshToken,
        userId: user._id,
        expiryDate,
        lastUsedAt: new Date(),
      });

      await refreshTokenDocument.save();

      return refreshToken;
    } catch (error) {
      this.logger.error(`Error in createRefreshToken for user ${user}`, error);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async validateRefreshToken(token: string): Promise<any> {
    try {
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify(token);
      const refreshToken = await this.refreshTokenModel.findOne({
        token: token,
        userId: new Types.ObjectId(payload.userId)
      }).exec();

      if (!refreshToken || refreshToken.userId.toString() !== payload.userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Ensure the refresh token is not expired
      if (refreshToken.expiryDate < new Date()) {
        // Invalidate the old refresh token
        await this.refreshTokenModel.deleteOne({
          token: token,
          userId: new Types.ObjectId(payload.userId)
        });
        throw new UnauthorizedException('Expired refresh token');
      }

      const user = await this.userService.findByUserId(refreshToken.userId.toString());

      // Check if the user account is still active
      if (!user) {
          throw new UnauthorizedException('User account is inactive');
      }

      // Update the lastUsedAt field to the current time
      refreshToken.lastUsedAt = new Date();
      await refreshToken.save();

      return user;
    } catch (error) {
      this.logger.error(`Error in validateRefreshToken for token ${token}`, error);
      if (error.name === 'UnauthorizedException') {
        throw error;
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  // Method to generate access token from refresh token
  async refreshToken(token: string): Promise<{ access_token: string, refresh_token: string }> {
    try {
      const user = await this.validateRefreshToken(token);
      if (!user) {
          throw new UnauthorizedException('Failed to validate refresh token');
      }

      // Invalidate the old refresh token
      const result = await this.refreshTokenModel.deleteOne({
        token: token,
        userId: new Types.ObjectId(user._id)
      });

      // Generate a new refresh token
      const newRefreshToken = await this.createRefreshToken(user);

      // Generate a new access token
      const newAccessToken = await this.createAccessToken(user);

      return {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
      };
    } catch (error) {
      this.logger.error(`Error in refreshToken for token ${token}`, error);
      if (error.name === 'UnauthorizedException') {
        throw error;
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  async invalidateRefreshToken(token: string, userId: string): Promise<void> {
    try {
      const result = await this.refreshTokenModel.deleteOne({
        token: token,
        userId: new Types.ObjectId(userId)
      });

      if (result.deletedCount === 0) {
        this.logger.error(`Could not invalidate Refresh token ${token} for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Could not invalidate Refresh token ${token} for user ${userId}`, error);
    }
  }

  // Commenting the code to invalidate the refresh token by setting the expiry to now.
  /*async invalidateRefreshToken(token: string, userId: string): Promise<void> {
    const update = { expiryDate: new Date() }; // Invalidate the token by setting expiry to now
    const options = { new: true };

    const refreshToken = await this.refreshTokenModel.findOneAndUpdate({
      token: token,
      userId: new Types.ObjectId(userId)
    }, update, options);

    console.log('refreshToken in invalidate: ', refreshToken);

    if (!refreshToken) {
      console.error(`Could not invalidate Refresh token ${token}`);
    }
  }*/
}
