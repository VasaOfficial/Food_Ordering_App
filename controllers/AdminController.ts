import { Request, Response, NextFunction} from 'express'
import { CreateVendorInput } from '../dto'
import { Vendor } from '../models'
import { GeneratePassword, GenerateSalt } from '../utils/PasswordUtil'

export const CreateVendor = async (req: Request, res: Response, next: NextFunction) => {
  const { name, address, pincode, foodType, email, password, ownerName, phone } = <CreateVendorInput>req.body

  const existingVendor = await Vendor.findOne({ email: email })

  if(existingVendor !== null) {
    return res.json({ 'message': 'A vendor with this ID already exists'})
  }

  // generate the salt 

  const salt = await GenerateSalt()
  const userPassword = await GeneratePassword(password, salt)
  // encrypt the password using the salt

  const createdVendor = await Vendor.create({
    name: name,
    address: address,
    pincode: pincode,
    foodType: foodType,
    email: email,
    password: userPassword,
    salt: salt,
    ownerName: ownerName,
    phone: phone,
    rating: 0,
    serviceAvailable: false,
    coverImages: []
  })

  return res.json(createdVendor)
}

export const GetVendors = async (req: Request, res: Response, next: NextFunction) => {

}

export const GetVendorsByID = async (req: Request, res: Response, next: NextFunction) => {

}