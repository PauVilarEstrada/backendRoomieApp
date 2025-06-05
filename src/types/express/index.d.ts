import { Request } from 'express'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    profileType: string
    isAdmin: boolean
  }
}
