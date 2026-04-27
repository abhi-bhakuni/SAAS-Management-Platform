import { Logger } from '@nestjs/common';
import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';

export class TypeOrmCustomLogger implements TypeOrmLogger {
  private logger = new Logger('TypeORM');

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.logger.debug(
      `Query: ${query} -- Params: ${JSON.stringify(parameters)}`,
    );
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    this.logger.error(
      `Query Error: ${error} -- Query: ${query} -- Params: ${JSON.stringify(parameters)}`,
    );
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    this.logger.warn(`Slow Query (${time} ms): ${query}`);
  }

  logSchemaBuild(message: string) {
    this.logger.log(message);
  }

  logMigration(message: string) {
    this.logger.log(message);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    if (level === 'log') this.logger.log(message);
    else if (level === 'info') this.logger.debug(message);
    else if (level === 'warn') this.logger.warn(message);
  }
}