import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [OpenaiModule],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
