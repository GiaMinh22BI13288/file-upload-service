import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    // Lấy IP chuẩn (ưu tiên x-forwarded-for)
    const ip = request.headers['x-forwarded-for'] || request.ip || request.socket.remoteAddress; 
    
    console.log('>>> [Audit Debug] User info:', user); 

    // Nếu user chưa login (hoặc login thất bại), userId sẽ null
    const userId = user ? user.userId : null;

    // Hàm chung để lưu log
    const saveLog = (status: string) => {
      let cleanIp = ip;
      if (typeof ip === 'string') {
         cleanIp = ip.replace('::ffff:', '');
      }

      const actionDescription = this.getDescription(method, url);
      
      // Gọi service với thêm tham số status
      this.auditService.logAction(userId, actionDescription, method, cleanIp, status);
    };

    return next.handle().pipe(
      // 1. Nếu thành công -> Ghi log SUCCESS
      tap(() => {
        saveLog('SUCCESS');
      }),
      // 2. Nếu thất bại (Lỗi) -> Ghi log FAILED
      catchError((err) => {
        saveLog('FAILED');
        // Ném lỗi tiếp để Frontend nhận được thông báo lỗi như bình thường
        return throwError(() => err);
      }),
    );
  }

  private getDescription(method: string, url: string): string {
    // --- AUTHENTICATION ---
    if (url.includes('/auth/login')) return 'Đăng nhập hệ thống';
    if (url.includes('/auth/register')) return 'Đăng ký tài khoản';

    // --- FILES MODULE ---
    if (url.includes('/files/upload') && method === 'POST') return 'Upload file mới';
    if (url.match(/\/files\/.*\/download/) && method === 'GET') return 'Tải xuống file';
    if (url.includes('/files/search') && method === 'GET') return 'Tìm kiếm file';
    if (url.includes('/files') && method === 'DELETE') return 'Xóa file (Thùng rác)';
    if (url.includes('/files') && method === 'GET') return 'Xem danh sách file';

    // --- AUDIT MODULE ---
    if (url.includes('/audit')) return 'Xem nhật ký hoạt động';

    // Mặc định
    return `${method} ${url}`;
  }
}