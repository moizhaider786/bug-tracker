import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { USER_ROLES } from "src/types";

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({type: 'varchar', length: 100, nullable: false})
  name!: string;

  @Column({type: 'enum', enum: USER_ROLES, nullable: false})
  role!: USER_ROLES

  @CreateDateColumn()
  createdAt!: Date
}