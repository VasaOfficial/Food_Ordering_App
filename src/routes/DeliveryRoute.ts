import express from 'express'
import { DeliveryUserLogin, DeliveryUserSignup, EditDeliveryUserProfile, GetDeliveryUserProfile, UpdateDeliveryUserStatus } from '../controllers'
import { Authenticate } from '../middlewares'

const router = express.Router()

// sign up / create customer
router.post('/signup', DeliveryUserSignup)

// login
router.post('/login', DeliveryUserLogin)

// authenticate needed for some routes
router.use(Authenticate)

// Change service status
router.patch('/change-status', UpdateDeliveryUserStatus)

// profile 
router.get('/profile', GetDeliveryUserProfile)
router.patch('/profile', EditDeliveryUserProfile)

export { router as DeliveryRoute }