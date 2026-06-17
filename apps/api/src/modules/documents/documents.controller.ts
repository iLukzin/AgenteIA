import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
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

  @Delete(':id') delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
