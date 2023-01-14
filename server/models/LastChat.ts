import { Schema, model, Document, Model } from 'mongoose'
import { ILastChat } from '../controllers/LastChatControllers/type'

const lastchat = new Schema<ILastChat>({
  readerId: { type: String, required: true },
  targetId: { type: String, required: true },
  username: {type : String, required: false },
  lastMessage: { type: String, required: false },
  roomId: { type: String, required: false },
  unreadCount: { type: Number, required: false },
  updatedAt: { type: Date, default: Date.now, required: false },
})

const LastChat = model<ILastChat>('lastchat', lastchat)
// create new User document

export interface ILastChatDocument extends ILastChat, Document {}
export interface ILastChatModel extends Model<ILastChatDocument> {}
export default LastChat