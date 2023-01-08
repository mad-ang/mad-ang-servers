const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../models')
import { config } from '../envconfig'
const AUTH_ERROR = { message: '사용자 인증 오류' }
const User = db.users

async function hashPassword(user) {
  const password = user.password
  const saltRounds = config.bcrypt.saltRounds

  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, function (err, hash) {
      if (err) reject(err)
      resolve(hash)
    })
  })

  return hashedPassword
}

export const signUp = async (req, res) => {
  try {
    if (!req.body.userId) {
      return res.status(400).json({
        status: 400,
        message: '사용하실 아이디를 입력해주세요.',
      })
    }
    if (!req.body.password) {
      return res.status(400).json({
        status: 400,
        message: '사용하실 비밀번호를 입력해주세요.',
      })
    }

    const userInfo = {
      username: req.body.username,
      userId: req.body.userId,
      password: req.body.password,
    }

    let foundUser = await User.findOne({ where: { userId: userInfo.userId } }).catch((err) =>
      console.log(err)
    )
    if (foundUser) {
      return res.status(409).json({
        status: 409,
        message: '이미 존재하는 아이디입니다.',
      })
    }

    userInfo.password = await hashPassword(userInfo)

    const user = await User.create(userInfo).catch((err) => console.log(err))
    return res.status(200).json({
      status: 200,
      payload: {
        username: user.username,
        userId: user.userId,
      },
    })
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: `서버 오류: ${error}`,
    })
  }
}

export const login = async (req, res) => {
  try {
    // * Validate user input
    if (!req.body.userId) {
      return res.status(400).json({
        status: 400,
        message: '아이디를 입력해주세요.',
      })
    }
    if (!req.body.password) {
      return res.status(400).json({
        status: 400,
        message: '비밀번호를 입력해주세요.',
      })
    }
    const { userId, password } = req.body

    let foundUser = await User.findOne({ where: { userId: userId } }).catch((err) =>
      console.log(err)
    )
    if (!foundUser) {
      return res.status(400).json({
        status: 400,
        message: '아이디를 확인해주세요.',
      })
    }

    const isPasswordCorrect = await bcrypt.compare(password, foundUser.password)
    if (isPasswordCorrect) {
      const accessToken = jwt.sign(
        {
          username: foundUser.username,
          userId: foundUser.userId,
        },
        config.jwt.secretKey
        // {
        //   expiresIn: config.jwt.expiresInSec,
        // }
      )

      const refreshToken = 'refreshToken'

      await User.update(
        {
          refreshToken: refreshToken,
        },
        { where: { userId: userId } }
      )
      res.append('Set-Cookie', `refreshToken=${refreshToken}; Secure; HttpOnly;`)
      return res.status(200).json({
        status: 200,
        payload: {
          userId: foundUser.userId,
          accessToken: accessToken,
        },
      })
    } else {
      return res.status(400).json({
        status: 400,
        message: '비밀번호가 올바르지 않습니다.',
      })
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: `서버 오류: ${error}`,
    })
  }
}
export const getAllUsers = async (req, res) => {
  let users = await User.findAll({}).catch((err) => console.log(err))
  res.status(200).send(users)
}

export const getUser = async (req, res) => {
  let id = req.params.id
  let user = await User.findOne({ where: { id: id } }).catch((err) => console.log(err))
  res.status(200).send(user)
}

const isAuth = async (req, res, next) => {
  const authHeader = req.get('Authorization')
  if (!(authHeader && authHeader?.startsWith('Bearer '))) {
    return res.status(401).json(AUTH_ERROR)
  }

  const token = authHeader.split(' ')[1]
  // 사용자가 주장하는 본인의 토큰 -> id, isAdmin값이 진실인지 아직 모름(위조되었을 수도?)

  jwt.verify(token, config.jwt.secretKey, async (error, decoded) => {
    // secretKey로 디코딩 및 검증
    if (error) {
      return res.status(401).json(AUTH_ERROR)
    }

    // (권한 관련 기능 사용하려고 할 때 )이 사용자의 isAdmin이 우리 DB의 정보와 매칭되는지도 추가로 매칭 확인)

    next()
  })
}

export const updateUser = async (req, res) => {
  const next = async (userData) => {
    if (userData.password) {
      userData.password = await hashPassword(userData)
    }
    const user = await User.update(userData, { where: { userId: userData.userId } }).catch((err) =>
      console.log(err)
    )
    if (userData.password) {
      delete userData.password
    }
    return res.status(200).json({
      status: 200,
      payload: userData,
    })
  }
  isAuth(req, res, next.bind(null, req.body))
}

export const deleteUser = async (req, res) => {
  let id = req.params.id
  await User.destroy({ where: { id: id } }).catch((err) => console.log(err))
  res.status(200).send('User is deleted')
}
