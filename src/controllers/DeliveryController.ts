import { Request, Response, NextFunction } from 'express'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'
import { UserLoginInputs, EditCustomerProfileInputs, CreateDeliveryUserInputs } from '../dto/Customer.dto'
import { GeneratePassword, GenerateSalt, GenerateSignature, ValidatePassword } from '../utils/PasswordUtil'
import { DeliveryUser } from '../models'

export const DeliveryUserSignup = async (req: Request, res: Response, next: NextFunction) => {
  const deliveryUserInputs = plainToClass(CreateDeliveryUserInputs, req.body)

  const inputErrors = await validate(deliveryUserInputs, { validationError: { target: true }})

  if(inputErrors.length > 0) {
    return res.status(400).json(inputErrors)
  }

  const { email, password, phone, address, firstName, lastName, pincode } = deliveryUserInputs

  const salt = await GenerateSalt()
  const userPassword = await GeneratePassword(password, salt)

  const existingDeliveryUser = await DeliveryUser.findOne({ email: email })

  if(existingDeliveryUser !== null) {
    return res.status(400).json('A Delivery user exist with provide email ID')
  }

  const result = await DeliveryUser.create({
    email: email,
    password: userPassword,
    salt: salt,
    phone: phone,
    firstName: firstName,
    lastName: lastName,
    address: address,
    pincode: pincode,
    verified: false,
    lat: 0,
    lng: 0,
    isAvailable: false
  })

  if(result) {
    // generate the signature 
    const signature = GenerateSignature({
      _id: result.id,
      email: result.email,
      verified: result.verified
    })

    // send the result to client
    return res.status(201).json({ signature: signature, verified: result.verified, emailL: result.email })
  }

  return res.status(400).json('Unable to signup')
}

export const DeliveryUserLogin = async (req: Request, res: Response, next: NextFunction) => {
  const loginInputs = plainToClass(UserLoginInputs, req.body)

  const loginErrors = await validate(loginInputs, { validationError: { target: false }})

  if(loginErrors.length > 0){
    return res.status(400).json(loginErrors)
  }

  const { email, password } = loginInputs

  const deliveryUser = await DeliveryUser.findOne({ email: email })

  if(deliveryUser) {
    const validation = await ValidatePassword(password, deliveryUser.password, deliveryUser.salt)

    if(validation) {  
      // generate signature
      const signature = GenerateSignature({
        _id: deliveryUser.id,
        email: deliveryUser.email,
        verified: deliveryUser.verified
      })

      // send result to client
      return res.status(201).json({ signature: signature, verified: deliveryUser.verified, email: deliveryUser.email })
    }
  }

  return res.status(404).json('Login error')
}

export const GetDeliveryUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const deliveryUser = req.user

  if(deliveryUser) {
    const profile = await DeliveryUser.findById(deliveryUser._id)

    if(profile) {
      return res.status(200).json(profile)
    }
  }

  res.status(400).json({ message: 'Error retrieving profile' })
}

export const EditDeliveryUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const deliveryUser = req.user

  const profileInputs = plainToClass(EditCustomerProfileInputs, req.body)

  const profileErrors = await validate(profileInputs, { validationError: { target: false }})

  if(profileErrors.length > 0) {
    return res.status(400).json(profileErrors)
  }

  const { firstName, lastName, address } = profileInputs

  if(deliveryUser) {
    const profile = await DeliveryUser.findById(deliveryUser._id)

    if(profile) {
      profile.firstName = firstName
      profile.lastName = lastName
      profile.address = address

      const result = profile.save()

      res.status(200).json(result)
    }
  }
  res.status(400).json({ message: 'Error retrieving profile' })
}

//**  Delivery Notification */
export const UpdateDeliveryUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  const deliveryUser = req.user;
  
  if(deliveryUser){  
    const { lat, lng } = req.body;

    const profile = await DeliveryUser.findById(deliveryUser._id);

    if(profile){
      if(lat && lng){
        profile.lat = lat;
        profile.lng = lng;
      }

      profile.isAvailable = !profile.isAvailable;

      const result = await profile.save();

      return res.status(201).json(result);
    }
  }
  return res.status(400).json({ msg: 'Error while Updating Profile'});

}