import { Request, Response, NextFunction } from 'express'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'
import { CreateCustomerInputs, UserLoginInputs, EditCustomerProfileInputs } from '../dto/Customer.dto'
import { GenerateOtp, onRequestOtp } from '../utils/NotificationUtil'
import { GeneratePassword, GenerateSalt, GenerateSignature, ValidatePassword } from '../utils/PasswordUtil'
import { Customer } from '../models'

export const CustomerSignup = async (req: Request, res: Response, next: NextFunction) => {
  const customerInputs = plainToClass(CreateCustomerInputs, req.body)

  const inputErrors = await validate(customerInputs, { validationError: { target: true }})

  if(inputErrors.length > 0) {
    return res.status(400).json(inputErrors)
  }

  const { email, password, phone } = customerInputs

  const salt = await GenerateSalt()
  const userPassword = await GeneratePassword(password, salt)

  const { otp, expiry } = GenerateOtp()

  const existingCustomer = await Customer.findOne({ email: email })

  if(existingCustomer !== null) {
    return res.status(400).json('Customer already exists')
  }

  const result = await Customer.create({
    email: email,
    password: userPassword,
    salt: salt,
    phone: phone,
    otp: otp,
    otp_expiry: expiry,
    firstName: '',
    lastName: '',
    address: '',
    verified: false,
    lat: 0,
    lng: 0
  })

  if(result) {
    // send otp to customer
    await onRequestOtp(otp, phone)
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

export const CustomerLogin = async (req: Request, res: Response, next: NextFunction) => {
  const loginInputs = plainToClass(UserLoginInputs, req.body)

  const loginErrors = await validate(loginInputs, { validationError: { target: false }})

  if(loginErrors.length > 0){
    return res.status(400).json(loginErrors)
  }

  const { email, password } = loginInputs

  const customer = await Customer.findOne({ email: email })

  if(customer) {
    const validation = await ValidatePassword(password, customer.password, customer.salt)

    if(validation) {  
      // generate signature
      const signature = GenerateSignature({
        _id: customer.id,
        email: customer.email,
        verified: customer.verified
      })

      // send result to client
      return res.status(201).json({ signature: signature, verified: customer.verified, email: customer.email })
    }
  }

  return res.status(404).json('Login error')
}

export const CustomerVerify = async (req: Request, res: Response, next: NextFunction) => {
  const { otp } = req.body
  const customer = req.user

  if(customer) {
    const profile = await Customer.findById(customer._id)

    if(profile) {
      if(profile.otp === parseInt(otp) && profile.otp_expiry >= new Date()) {
        profile.verified = true

        const updatedCustomerResponse= await profile.save()

        // generate signature 
        const signature = GenerateSignature({
          _id: updatedCustomerResponse.id,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified
        })

        return res.status(201).json({ 
          signature: signature,
          verified: updatedCustomerResponse.verified,
          email: updatedCustomerResponse.email
        })
      }
    }
  }

  return res. status(400).json('Error with otp validation')
}

export const RequestOtp = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user

  if(customer) {
    const profile = await Customer.findById(customer._id)

    if(profile) {
      const { otp, expiry } = GenerateOtp()

      profile.otp = otp
      profile.otp_expiry = expiry

      await profile.save()
      await onRequestOtp(otp, profile.phone)

      res.status(200).json('Otp sent successfully')
    }
  }
}

export const GetCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user

  if(customer) {
    const profile = await Customer.findById(customer._id)

    if(profile) {
      return res.status(200).json(profile)
    }
  }

  res.status(400).json({ message: 'Error retrieving profile' })
}

export const EditCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user

  const profileInputs = plainToClass(EditCustomerProfileInputs, req.body)

  const profileErrors = await validate(profileInputs, { validationError: { target: false }})

  if(profileErrors.length > 0) {
    return res.status(400).json(profileErrors)
  }

  const { firstName, lastName, address } = profileInputs

  if(customer) {
    const profile = await Customer.findById(customer._id)

    if(profile) {
      profile.firstName = firstName
      profile.lastName = lastName
      profile.address = address

      const result = profile.save()

      res.status(200).json(result)
    }
  }
}