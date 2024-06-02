import mongoose from 'mongoose'
import { MONGO_URI } from '../config'

mongoose.connect(MONGO_URI).then(result => {
  console.log('DB connected')
}).catch(err => console.log('error', err))


export default async () => {
  try {
    await mongoose.connect(MONGO_URI)

    console.log('DB connected...')
  } catch (ex) {
    console.log(ex)
  }
}