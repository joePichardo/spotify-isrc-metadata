import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { ApiOperation } from '@nestjs/swagger';
import { SpotifyOauthGuard } from './guard';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(SpotifyOauthGuard)
  @Post('signup')
  @ApiOperation({ summary: 'Create user' })
  async signup(@Body() dto: AuthDto) {
    return await this.authService.signup(dto);
  }

  @UseGuards(SpotifyOauthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  @ApiOperation({ summary: 'Sign in user' })
  signin(@Body() dto: AuthDto) {
    return this.authService.signin(dto);
  }

  @UseGuards(SpotifyOauthGuard)
  @Get('spotify')
  spotifyAuth(@Req() req: Request, @Res() res: Response) {
    return;
  }

  @UseGuards(SpotifyOauthGuard)
  @Get('spotify-redirect')
  spotifyAuthRedirect(@Req() req: Request, @Res() res: Response) {
    return this.authService.spotifyLogin(req, res);
  }
}
