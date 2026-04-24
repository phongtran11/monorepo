import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Session } from './session.entity';

/**
 * Repository for managing Session entities.
 * Extends TypeORM Repository to provide database operations for sessions.
 */
@Injectable()
export class SessionRepository extends Repository<Session> {
  constructor(protected dataSource: DataSource) {
    super(Session, dataSource.createEntityManager());
  }
}
