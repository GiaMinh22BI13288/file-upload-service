import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt')) 
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getLogs() {
    return this.auditService.findAll();
  }
}