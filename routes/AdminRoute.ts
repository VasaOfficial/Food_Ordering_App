import express, { Request, Response, NextFunction } from 'express'
import { CreateVendor, GetVendors, GetVendorsByID } from '../controllers/AdminController'

const router = express.Router()

router.post('/vendor', CreateVendor)

router.get('/vendor', GetVendors)

router.get('/vendor/id', GetVendorsByID)

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'hello from Admin'})
})

export { router as AdminRoute }