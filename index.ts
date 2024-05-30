import express from 'express'

const app = express()

app.use('/', (req, res) => {
  return res.json('hello from food order backend')
})

app.listen(8000, () => {
  console.log('App is listening to port 8000')
})