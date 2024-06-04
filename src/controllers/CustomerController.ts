import { Request, Response, NextFunction } from 'express'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'
import { CreateCustomerInputs, UserLoginInputs, EditCustomerProfileInputs, OrderInputs, CartItem } from '../dto/Customer.dto'
import { GenerateOtp, onRequestOtp } from '../utils/NotificationUtil'
import { GeneratePassword, GenerateSalt, GenerateSignature, ValidatePassword } from '../utils/PasswordUtil'
import { Customer, Food, Order, Offer, Transaction, Vendor, DeliveryUser } from '../models'

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
    lng: 0,
    orders: []
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

//**  Cart Section */

export const AddToCart = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user

  if(customer) {
    const profile = await Customer.findById(customer._id)
    let cartItems = Array()
    
    const { _id, unit } = <CartItem>req.body

    const food = await Food.findById(_id)

    if(food) {

      if(profile != null) {
        // check for cart items
        cartItems = profile.cart

        if(cartItems.length > 0) {
          // check and update unit
          let existingFoodItem = cartItems.filter((item) => item.food._id.toString() == _id)

          if(existingFoodItem.length > 0) {
            const index = cartItems.indexOf(existingFoodItem[0])
            
            if(unit > 0) {
              cartItems[index] = { food, unit }

            }else {
              cartItems.splice(index, 1)
            }
          } else {
            cartItems.push({ food, unit })
          }
        } else {
          // add new item to cart
          cartItems.push({ food, unit })
        }

        if(cartItems) {
          profile.cart = cartItems as any
          const cartresult = await profile.save()
          return res.status(200).json(cartresult.cart)
        }
      }
    }
  }
  
  return res.status(400).json({ message: 'Error adding to cart' })   
}

export const GetCart = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user

  if(customer) {
    const profile = await Customer.findById(customer._id).populate('cart.food')
    if(profile) {
      return res.status(200).json(profile.cart)
    }
  }
  return res.status(400).json({ message: 'Cart is empty' })
}

export const DeleteCart = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user

  if(customer) { 
    const profile = await Customer.findById(customer._id).populate('cart.food')
    if(profile != null) {
      profile.cart = [] as any
      const cartResult = await profile.save()

      return res.status(200).json(cartResult)
    }
  }
}

export const VerifyOffer = async (req: Request, res: Response, next: NextFunction) => {

  const offerId = req.params.id;
  const customer = req.user;
  
  if(customer){

      const appliedOffer = await Offer.findById(offerId);
      
      if(appliedOffer){
          if(appliedOffer.isActive){
              return res.status(200).json({ message: 'Offer is Valid', offer: appliedOffer});
          }
      }

  }

  return res.status(400).json({ msg: 'Offer is Not Valid'});
}

//**  Create Payment  */
export const CreatePayment = async (req: Request, res: Response, next: NextFunction) => {

  const customer = req.user;

  const { amount, paymentMode, offerId} = req.body;

  let payableAmount = Number(amount);

  if(offerId){

      const appliedOffer = await Offer.findById(offerId);

      if(appliedOffer.isActive){
          payableAmount = (payableAmount - appliedOffer.offerAmount);
      }
  }

  // create record on transaction
  const transaction = await Transaction.create({
      customer: customer._id,
      vendorId: '',
      orderId: '',
      orderValue: payableAmount,
      offerUsed: offerId || 'NA',
      status: 'OPEN',
      paymentMode: paymentMode,
      paymentResponse: 'Payment is cash on Delivery'
  })

  return res.status(200).json(transaction);
}

//**  Delivery Notification */
const assignOrderForDelivery = async (orderId: string, vendorId: string) => {
  const vendor = await Vendor.findById(vendorId);

  if(vendor){
    const areaCode = vendor.pincode
    const vendorLat = vendor.lat
    const vendorLng = vendor.lng

    const deliveryPerson = await DeliveryUser.find({ pincode: areaCode, verified: true, isAvailable: true});

    if(deliveryPerson){
      // Check the nearest delivery person and assign the order
      const currentOrder = await Order.findById(orderId);

      if(currentOrder){
        //update Delivery ID
        currentOrder.deliveryId = deliveryPerson[0]._id.toString();
        await currentOrder.save();
      }
    }
  }
}

//**  Order Section */
const validateTransaction = async(txnId: string) => {
    
  const currentTransaction = await Transaction.findById(txnId);

  if(currentTransaction){
      if(currentTransaction.status.toLowerCase() !== 'failed'){
          return {status: true, currentTransaction};
      }
  }
  return {status: false, currentTransaction};
}

export const CreateOrder = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user;
  const { txnId, amount, items } = <OrderInputs>req.body;

  if(customer){
    const { status, currentTransaction } =  await validateTransaction(txnId);

    if(!status){
        return res.status(404).json({ message: 'Error while Creating Order!'})
    }

    const profile = await Customer.findById(customer._id);

    const orderId = `${Math.floor(Math.random() * 89999 + 1000)}`;

    let cartItems = Array();
    let netAmount = 0.0;
    let vendorId;

    const foods = await Food.find().where('_id').in(items.map(item => item._id)).exec();

    foods.map(food => {
      items.map(({ _id, unit}) => {
        if(food._id == _id){
          vendorId = food.vendorId;
          netAmount += food.price * unit;
          cartItems.push({ food, unit: unit})
        }
      })
    })

    if(cartItems){
      const currentOrder = await Order.create({
        orderID: orderId,
        vendorId: vendorId,
        items: cartItems,
        totalAmount: netAmount,
        paidAmount: amount,
        orderDate: new Date(),
        orderStatus: 'Waiting',
        remarks: '',
        deliveryId: '',
        readyTime: 45
      })

      profile.cart = [] as any;
      profile.orders.push(currentOrder);


      currentTransaction.vendorId = vendorId;
      currentTransaction.orderId = orderId;
      currentTransaction.status = 'CONFIRMED'
      
      await currentTransaction.save();

      assignOrderForDelivery(currentOrder._id.toString(), vendorId);

      const profileSaveResponse =  await profile.save();

      res.status(200).json(profileSaveResponse);
    }else {
      res.status(400).json({ message: 'Error while Creating Order!'})
    }
  }
}

export const GetOrders = async (req: Request, res: Response, next: NextFunction) => {
  const customer = req.user

  if(customer) {
    const profile = await Customer.findById(customer._id).populate('orders')

    if(profile) {
      return res.status(200).json(profile.orders)
    }
  }
}

export const GetOrderById = async (req: Request, res: Response, next: NextFunction) => {
  const orderId = req.params.id

  if(orderId) {
    const order = (await Order.findById(orderId)).populate('items.food')

    res.status(200).json(order)
  }
}