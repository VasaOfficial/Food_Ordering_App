import express from 'express'
import { AdminRoute, VendorRoute } from './routes'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import { MONGO_URI } from './config'
import path from 'path'

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use('/admin', AdminRoute)
app.use('/vendor', VendorRoute)

mongoose.connect(MONGO_URI).then(result => {
  console.log('DB connected')
}).catch(err => console.log('error', err))

app.listen(8000, () => {
  //console.clear()
  console.log('App is listening to port 8000')
})