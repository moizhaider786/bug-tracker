import { ArrayMinSize, IsNotEmpty } from 'class-validator';

export class MembersDto {
  @IsNotEmpty()
  @ArrayMinSize(1, { message: 'Add atleast 1 member' })
  members!: number[];
}