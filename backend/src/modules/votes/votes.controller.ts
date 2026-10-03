import { Body, Controller, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsIn } from 'class-validator';
import { Request } from 'express';
import { VoteType } from './vote.entity';
import { VotesService } from './votes.service';

class VoteDto {
  @IsIn(['like', 'dislike'])
  voteType: VoteType;
}

@Controller('comments/:id/votes')
@UseGuards(AuthGuard('jwt'))
export class VotesController {
  constructor(private readonly votes: VotesService) {}

  @Post()
  vote(
    @Param('id', ParseUUIDPipe) commentId: string,
    @Body() dto: VoteDto,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.votes.vote(req.user.userId, commentId, dto.voteType);
  }
}