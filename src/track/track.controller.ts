import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtGuard } from 'src/auth/guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrackService } from './track.service';
import { IsrcDto } from './dto';

@UseGuards(JwtGuard)
@Controller('tracks')
@Injectable({})
export class TrackController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private trackService: TrackService,
  ) {}

  @Post('isrc')
  async postIsrc(@Body() dto: IsrcDto) {
    return await this.trackService.postIsrc(dto);
  }
}
