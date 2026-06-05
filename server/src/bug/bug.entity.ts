import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Check,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { BugType, BugStatus } from 'src/types';
import { Projects } from 'src/project/project.entity';
import { Users } from 'src/user/user.entity';

@Entity()
@Unique('UQ_BUGS_TITLE_CREATEDBY', ['title', 'createdBy'])
@Check('timelineSeconds >= 0')
export class Bugs {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 280 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: "enum", enum: BugStatus, default: BugStatus.NEW })
  status!: BugStatus;

  @Column({ type: "enum", enum: BugType })
  type!: BugType;

  @Column({ type: 'timestamp', nullable: true })
  deadline!: Date;

  @Column({default:0})
  timelineSeconds!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  screenShotUrl!: string;

  @Column()
  projectId!: number;

  @ManyToOne(() => Projects, (project) => project.bugs)
  @JoinColumn({ name: 'projectId' })
  project!: Projects;

  @Column()
  developerId!: number;

  @ManyToOne(() => Users, (user) => user.assignedBugs)
  @JoinColumn({ name: 'developerId' })
  developer!: Users;

  @Column()
  createdBy!: number;

  @ManyToOne(()=>Users, (user)=>user.createdBugs)
  @JoinColumn({ name: 'createdBy' })
  creator!: Users;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
