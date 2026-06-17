import { Body, Controller, Get, Post } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post() create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get() findAll() {
    return this.documentsService.findAll();
  }
}
