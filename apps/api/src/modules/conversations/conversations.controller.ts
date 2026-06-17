import { Controller, Get, Param, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get() findAll(@Query('status') status?: string) {
    return this.conversationsService.findAll(status);
  }

  @Get(':id/messages')
  findMessages(@Param('id') id: string) {
    return this.conversationsService.findMessages(id);
  }
}
