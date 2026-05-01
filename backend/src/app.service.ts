import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo(): object {
    return {
      name: 'SAAS Management Platform API',
      version: '1.0.0',
      status: 'ok',
    };
  }
}
