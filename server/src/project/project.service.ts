import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Projects } from './project.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Projects)
    private readonly projectRepo: Repository<Projects>,
  ) {}

  createProject(){
    this.projectRepo.create();
  }
}
