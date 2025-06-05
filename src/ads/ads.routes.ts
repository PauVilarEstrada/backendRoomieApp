import { Router } from 'express'
import { getAllAds, getSwipeAds, swipeAd, getMyMatches, createListing, getMapMarkers, getAdById, registerAdClick } from './ads.controller'
import { verifyToken } from '../middlewares/auth.middleware'


const router = Router()

router.get('/', getAllAds)
router.get('/swipe', verifyToken, getSwipeAds)
router.post('/swipe/:adId', verifyToken, swipeAd)
router.get('/matches', verifyToken, getMyMatches)
router.post('/create', verifyToken, createListing)
router.get('/map-markers', getMapMarkers)
router.get('/:id', getAdById)
router.post('/:id/click', registerAdClick)

export default router
