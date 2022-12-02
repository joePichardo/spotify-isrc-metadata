import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JwtStrategy } from 'src/auth/strategy';
import { TrackController } from './track.controller';
import { TrackService } from './track.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [TrackController],
  providers: [TrackService, JwtStrategy],
})
export class TrackModule {}
