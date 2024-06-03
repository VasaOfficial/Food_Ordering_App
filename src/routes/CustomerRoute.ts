import express from 'express'
import { CustomerLogin, CustomerSignup, CustomerVerify, EditCustomerProfile, GetCustomerProfile, GetOrderById, CreateOrder, GetOrders, RequestOtp } from '../controllers'
import { Authenticate } from '../middlewares'

const router = express.Router()

// sign up / create customer
router.post('/signup', CustomerSignup)

// login
router.post('/login', CustomerLogin)

// authenticate needed for some routes
router.use(Authenticate)

// verify customer account
router.patch('/verify', CustomerVerify)

// otp / requesting otp
router.get('/otp', RequestOtp)

// profile 
router.get('/profile', GetCustomerProfile)
router.patch('/profile', EditCustomerProfile)



// cart 


// payment

// order
router.post('/create-order', CreateOrder)
router.get('/orders', GetOrders)
router.get('/order/:id', GetOrderById)

export { router as CustomerRoute }