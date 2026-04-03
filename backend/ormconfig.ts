import { DataSource } from 'typeorm';
import { dataSourceOptions } from './src/config/database.config';

export const AppDataSource = new DataSource(dataSourceOptions);
