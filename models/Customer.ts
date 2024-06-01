import mongoose, { Schema, Document } from 'mongoose';

interface CustomerDoc extends Document {
  email: string;
  phone: string;
  password: string;
  salt: string;
  address: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  otp: number;
  otp_expiry: Date;
  lat: number;
  lng: number;
}

const CustomerSchema = new Schema({
  email: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  address: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  verified: { type: Boolean, required: true },
  otp: { type: Number },
  otp_expiry: { type: Date },
  lat: { type: Number },
  lng: { type: Number },
}, {
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret.salt;
      delete ret.__v;
      delete ret.createdAt;
      delete ret.updatedAt;
    }
  },
  timesStamps: true
});

const Customer = mongoose.model<CustomerDoc>('customer', CustomerSchema);
export { Customer }