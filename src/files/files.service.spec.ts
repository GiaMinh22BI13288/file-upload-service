import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { FileStatus } from './entities/file.entity';

// Mock Repository (Giả lập Database)
const mockFileRepository = {
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn().mockImplementation((file) => Promise.resolve({ id: 'uuid-123', ...file })),
  find: jest.fn(),
};

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(FileEntity),
          useValue: mockFileRepository,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test Case 1: Lưu file thành công
  it('should save initial file metadata', async () => {
    const mockFile = {
      originalname: 'test.pdf',
      filename: 'random.pdf',
      mimetype: 'application/pdf',
      path: 'uploads/random.pdf',
    } as any;

    const mockUser = { userId: 'user-123' };

    const result = await service.saveInitialFile(mockFile, mockUser);

    expect(result).toEqual({
      id: 'uuid-123',
      originalName: 'test.pdf',
      filename: 'random.pdf',
      mimetype: 'application/pdf',
      path: 'uploads/random.pdf',
      status: FileStatus.PENDING,
      user: 'user-123'
    });
    
    // Kiểm tra xem hàm save của DB có được gọi không
    expect(mockFileRepository.save).toHaveBeenCalled(); 
  });
});