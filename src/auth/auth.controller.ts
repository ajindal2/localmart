import { Controller, Post, Body, UseGuards, UsePipes, ValidationPipe, BadRequestException, Request, UnauthorizedException, HttpCode, UseInterceptors, UploadedFile, HttpStatus, Req, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { CreateUserDTO } from 'src/user/dtos/create-user.dto';
import { LocalAuthGuard } from 'src/auth/guards/local-auth.guard';
import { RefreshTokenDTO } from './dtos/fresh-token.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContactUsDTO } from './dtos/contact-us.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { ReportListingDTO } from './dtos/report-listing.dto';
import { ReportUserDto } from './dtos/report-user.dto';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}
  private logger: Logger = new Logger('AuthController');

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return await this.authService.login(req.user);
  }

  @Post('/register')
  @UsePipes(new ValidationPipe({
    transform: true,
    exceptionFactory: (errors) => {
      const formattedErrors = errors.reduce((acc, err) => {
        acc[err.property] = Object.values(err.constraints)[0]; // Taking the first error message for each field
        return acc;
      }, {});
      throw new BadRequestException({ errors: formattedErrors });
    }
  }))
  async register(@Body() createUserDTO: CreateUserDTO) {
    try {
      const user = await this.userService.createUser(createUserDTO);
      return user;
    } catch (error) {
      this.logger.error('Error during registration', error);
      if (error.name === 'ConflictException') {
        throw error;
      } else {
        throw new BadRequestException('Error processing your request');
      }
    }
  }

  @Post('forgot-password')
  @UseGuards(ThrottlerGuard) // Apply ThrottlerGuard
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async forgotPassword(@Body('email') email: string): Promise<{ message: string }> {
    await this.authService.handleForgotPassword(email);
    return { message: 'If your email address is registered with us, you will receive an email with a new password.' };
  }

  @Post('/refresh')
  @UseGuards(ThrottlerGuard) 
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async refresh(@Body() refreshTokenDto: RefreshTokenDTO) {
    const { access_token, refresh_token } = await this.authService.refreshTokens(refreshTokenDto.refreshToken);
    if (!access_token) {
      throw new UnauthorizedException();
    }
    return { access_token, refresh_token };
  }

  @Post('/logout')
  @UseGuards(JwtAuthGuard) // Ensures user is logged in before they can log out
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Express.Request, @Body() refreshTokenDto: RefreshTokenDTO): Promise<{ message: string }> {
    const refreshToken = refreshTokenDto.refreshToken;

    if (!req.user) {
      return { message: 'No user object found in request for logout' };
    }

    // Extract userId and check if it exists
    const userIdFromReq = req.user['userId']; 
    if (!userIdFromReq) {
      throw new UnauthorizedException('User ID not found in request');
    }
  
    await this.authService.invalidateRefreshToken(refreshToken, userIdFromReq);
    return { message: 'Logged out successfully' };
  }

  @Post('/contact-us')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('attachment'))
  async sendContactEmail(@UploadedFile() file: Express.Multer.File, @Body() contactUsDto: ContactUsDTO): Promise<string> {
    await this.authService.sendContactUsMail(
      contactUsDto.email,
      contactUsDto.subject,
      contactUsDto.message,
      file
    )
    return 'Your message has been sent successfully!';
  }

  @Post('/report-listing')
  @UseGuards(JwtAuthGuard) // Ensure only logged-in users can report
  async reportListing(@Req() req: Express.Request, @Body() reportListingDto: ReportListingDTO): Promise<string> {    
    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    // Extract userId and check if it exists
    const userIdFromReq = req.user['userId']; 
    if (!userIdFromReq) {
      throw new UnauthorizedException('User ID not found in request');
    }

    await this.authService.sendReportListingMail(reportListingDto, userIdFromReq);
    return 'Your report has been submitted successfully!';
  }

  @UseGuards(JwtAuthGuard)
  @Post('/report-user')
  async reportUser(@Body() reportUserDto: ReportUserDto, @Req() req: Express.Request) : Promise<string> {
    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    const reporterId = req.user['userId'];
    if (!reporterId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    // Validate that the reporterId matches the authenticated user
    if (reporterId !== reportUserDto.reporterId) {
      throw new UnauthorizedException('You are not authorized to perform this action');
    }

    return await this.authService.reportUser(reportUserDto);
  }
}