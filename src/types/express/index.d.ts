// src/types/express/index.d.ts
import 'express-serve-static-core'

declare module 'express-serve-static-core' {
  interface Request {
    /** el payload JWT, inyectado por verifyToken */
    user?: {
      userId: string
      email: string
      profileType: 'busco' | 'ofrezco'
      isAdmin: boolean
    }
  }
}
