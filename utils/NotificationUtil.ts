import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from "../config"
// Email 

// notification

// OTP 

export const GenerateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000)
  let expiry = new Date()
  expiry.setTime(new Date().getTime() + (30 * 60 * 1000))

  return { otp, expiry}
}

export const onRequestOtp = async (otp: number, toPhoneNumber: string) => {
  const accountSid = TWILIO_ACCOUNT_SID 
  const authToken = TWILIO_AUTH_TOKEN
  const client = require('twilio')(accountSid, authToken)

  const response = await client.messages.create({
    body: `Your OTP is +${otp}`,
    from: TWILIO_PHONE_NUMBER,
    to: `+381${toPhoneNumber}`,
  });

  return response 
}


// Payment notification or email