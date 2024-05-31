import express, { Request, Response, NextFunction } from 'express'
import { GetVendorProfile, UpdateVendorProfile, VendorLogin, UpdateVendorService } from '../controllers'
import { Authenticate } from '../middlewares'

const router = express.Router()

router.post('/login', VendorLogin)

router.use(Authenticate)
router.get('/profile', GetVendorProfile)
router.patch('/profile', UpdateVendorProfile)
router.patch('/service', UpdateVendorService)

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'hello from Vendor'})
})

export { router as VendorRoute }