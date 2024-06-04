export interface CreateVendorInput {
  name: string,
  ownerName: string,
  foodType: [string],
  pincode: string,
  address: string,
  phone: string,
  email: string,
  password: string
}

export interface EditVendorInputs {
  address: string;
  name: string;
  phone: string;
  foodTypes: [string];
}

export interface VendorLoginInputs {
  email: string;
  password: string;
}

export interface VendorPayload {
  _id: string;
  email: string;
  foodTypes: [string];
  name: string;
}

export interface CreateOfferInputs {
  offerType: string
  vendors: [string]
  title: string
  description: string
  minValue: number
  offerAmount: number
  startValidity: Date
  endValidity: Date
  promocode: string
  promoType: string
  bank: [any]
  bins: [any]
  pincode: string
  isActive: boolean
}