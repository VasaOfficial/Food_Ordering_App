import express, { Request, Response, NextFunction } from 'express'
import { GetVendorProfile, UpdateVendorProfile, VendorLogin, UpdateVendorService, AddFood, GetFood, UpdateVendorCoverImage } from '../controllers'
import { Authenticate } from '../middlewares'
import multer from 'multer'

const router = express.Router()

router.post('/login', VendorLogin)

const imageStorage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, 'images')
  },
  filename: function(req,file,cb){
    cb(null, new Date().toISOString().replace(/:/g, "-") + "_" + file.originalname);
  }
})

const images = multer({ storage: imageStorage}).array('images', 10);

router.use(Authenticate)
router.get('/profile', GetVendorProfile)
router.patch('/profile', UpdateVendorProfile)
router.patch('/coverimage', images, UpdateVendorCoverImage)
router.patch('/service', UpdateVendorService)

router.post('/food', images, AddFood)
router.get('/foods', GetFood)

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'hello from Vendor'})
})

export { router as VendorRoute }