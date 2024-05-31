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