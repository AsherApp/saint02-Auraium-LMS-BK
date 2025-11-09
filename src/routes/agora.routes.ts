import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AgoraService, AgoraRole } from '../services/agora.service.js'

const router = Router()

const tokenSchema = z.object({
  channelName: z.string().min(1),
  uid: z.union([z.string().min(1), z.number()]),
  role: z.union([z.enum(['publisher', 'audience']), z.number()]).optional(),
  expireTime: z.number().int().positive().optional()
})

router.post(
  '/token',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { channelName, uid, role, expireTime } = tokenSchema.parse(req.body)

    let agoraRole: AgoraRole
    if (role === undefined) {
      agoraRole = AgoraRole.PUBLISHER
    } else if (typeof role === 'number') {
      agoraRole = role === AgoraRole.AUDIENCE ? AgoraRole.AUDIENCE : AgoraRole.PUBLISHER
    } else {
      agoraRole = role === 'audience' ? AgoraRole.AUDIENCE : AgoraRole.PUBLISHER
    }

    const token = AgoraService.generateRtcToken(channelName, uid, agoraRole, expireTime)

    res.json({ token, uid: String(uid) })
  })
)

export { router as agoraRoutes }
