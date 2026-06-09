import { NotificationTypes } from "src/types"

export class CreateNotificationDto {
    title!: string
    description?: string
    type!: NotificationTypes
    users?: number[];
}