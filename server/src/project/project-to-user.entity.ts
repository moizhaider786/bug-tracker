import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Users } from 'src/user/user.entity';
import { Projects } from './project.entity';

@Entity()
export class ProjectsToUsers {
  @PrimaryColumn()
  userId!: number;

  @PrimaryColumn()
  projectId!: number;

  @ManyToOne(() => Users, (user) => user.assignedProjects)
  @JoinColumn({ name: 'userId' })
  user!: Users;

  @ManyToOne(() => Projects, (project) => project.projectUsers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project!: Projects;

  @CreateDateColumn()
  assignedAt!: Date;
}
