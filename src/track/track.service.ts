import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { ArtistDto, IsrcDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { User } from '.prisma/client';

@Injectable({})
export class TrackService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async postIsrc(dto: IsrcDto, user: User) {
    const { isrc } = dto;

    const tracksItems = [];
    let currentTracks = await this.fetchTracks(
      `https://api.spotify.com/v1/search?q=isrc:${isrc}&type=track&limit=1`,
      user.spotifyAuthToken,
    );
    tracksItems.push(...currentTracks.items);

    while (currentTracks.next) {
      currentTracks = await this.fetchTracks(
        currentTracks.next,
        user.spotifyAuthToken,
      );
      tracksItems.push(...currentTracks.items);
    }
    if (tracksItems.length === 0)
      throw new HttpException('No tracks found', HttpStatus.BAD_REQUEST);
    const popularTrack = tracksItems.reduce((a, b) =>
      a.popularity > b.popularity ? a : b,
    );

    const imageUri = popularTrack.album.images[0].url;
    const title = popularTrack.name;
    const artists = popularTrack.album.artists.map((artist) => {
      return { name: artist.name };
    });

    try {
      // save the new track in the db
      const track = await this.prisma.track.create({
        data: {
          isrc,
          title,
          imageUri,
          artists: {
            connectOrCreate: {
              where: artists[0],
              create: artists[0],
            },
          },
        },
        include: {
          artists: true,
        },
      });

      //return the saved track
      return track;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('ISRC Taken');
        }
      }

      throw error;
    }
  }

  async getIsrc(dto: IsrcDto) {
    // find the track by isrc
    const track = await this.prisma.track.findUnique({
      where: {
        isrc: dto.isrc,
      },
    });
    // if user does not exist throw exception
    if (!track)
      throw new HttpException('ISRC/Track not found', HttpStatus.NOT_FOUND);

    return track;
  }

  async getArtist(dto: ArtistDto) {
    // find the artist by name
    const artist = await this.prisma.artist.findUnique({
      where: {
        name: dto.name,
      },
    });
    // if artist does not exist throw exception
    if (!artist)
      throw new HttpException('Artist not found', HttpStatus.NOT_FOUND);

    // find tracks and artists
    const getTracksAndArtists = await this.prisma.track.findMany({
      where: {
        artists: {
          every: {
            name: {
              contains: dto.name,
            },
          },
        },
      },
    });

    // if tracks and artists does not exist throw exception
    if (!artist)
      throw new HttpException(
        'Tracks for artist not found',
        HttpStatus.NOT_FOUND,
      );

    return getTracksAndArtists;
  }

  async fetchTracks(url: string, token: string) {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then(({ tracks }) => tracks);
  }
}
