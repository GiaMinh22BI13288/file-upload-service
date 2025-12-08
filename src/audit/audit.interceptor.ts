import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const ip = request.ip;
    const user = request.user; // User chỉ có nếu đã qua bước đăng nhập

    return next.handle().pipe(
      tap(() => {
        // Chỉ ghi log khi request thành công
        const userId = user ? user.userId : 'GUEST';
        this.auditService.logAction(userId, url, method, ip);
      }),
    );
  }
}