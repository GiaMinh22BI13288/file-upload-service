import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { FilesService } from './files.service';
import { FileStatus } from './entities/file.entity';
import * as sharp from 'sharp';
import * as fs from 'fs';
const pdf = require('pdf-extraction'); 

@Processor('file-queue')
export class FileProcessor {
  constructor(private readonly filesService: FilesService) {}

  @Process('optimize')
  async handleOptimization(job: Job) {
    const { fileId, filePath, mimetype } = job.data;
    console.log(`🚀 Start processing file: ${fileId}`);

    try {
      // 1. Cập nhật DB
      await this.filesService.updateStatus(fileId, FileStatus.PROCESSING);

      let resultData = {};

      // 2. Logic xử lý
      if (mimetype.startsWith('image/')) { 
        const thumbPath = `uploads/thumb_${fileId}.jpg`;
        await sharp(filePath).resize(300).toFile(thumbPath);
        resultData = { thumbnail: thumbPath, note: 'Image resized' };
      } 
      else if (mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        resultData = { extractedText: data.text.substring(0, 200) + '...' };
      }

      // 3. Cập nhật DB 
      await this.filesService.updateStatus(fileId, FileStatus.DONE, resultData);
      console.log(`✅ File processed successfully: ${fileId}`);

    } catch (error) {
      console.error(`❌ Processing failed: ${error.message}`);
      await this.filesService.updateStatus(fileId, FileStatus.FAILED, { error: error.message });
    }
  }
}