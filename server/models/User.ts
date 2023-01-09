import { config } from '../envconfig'
import { Schema, model, Document, Model } from 'mongoose'
const bcrypt = require('bcrypt')
const saltRounds = config.bcrypt.saltRounds

interface IUser {
  userId: string
  password: string
  username?: string
  profileImgUrl?: string | null
  refreshToken?: string | null
  createdAt: string | null
  lastUpdated: string | null
}

const user = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: false },
  profileImgUrl: { type: String, required: false },
  refreshToken: { type: String, required: false },
  createdAt: { type: Date, required: false },
  lastUpdated: { type: Date, required: false },
})

user.pre('save', function (next) {
  const user = this // userSchema를 가르킴

  if (user.isModified('password')) {
    // password가 변경될 때만 Hashing 실행
    // genSalt: salt 생성
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return next(err)
      bcrypt.hash(user.password, salt, function (err, hashedPassword) {
        // hash의 첫번째 인자: 비밀번호의 Plain Text
        if (err) return next(err)
        user.password = hashedPassword // 에러없이 성공하면 비밀번호의 Plain Text를 hashedPassword로 교체해줌
        next() // Hashing이 끝나면 save로 넘어감
      })
    })
  } else {
    // password가 변경되지 않을 때
    next() // 바로 save로 넘어감
  }
})

const User = model<IUserDocument>('user', user)
// create new User document

export interface IUserDocument extends IUser, Document {}
export interface IUserModel extends Model<IUserDocument> {}
export default User
