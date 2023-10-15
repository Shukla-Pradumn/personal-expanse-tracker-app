const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('./db/config');
const User = require('./db/User');
const product = require('./db/Product');
const Product = require('./db/Product');
const Jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';

const app = express();
app.use(cors());
app.use(express.json());
app.post('/register', async (req, resp) => {
 let user = new User(req.body);
 let result = await user.save();
 result = result.toObject();
 delete result.password;
 Jwt.sign({ result }, jwtKey, { expiresIn: '2h' }, (err, token) => {
  if (err) {
   resp.send({ result: 'Something Went wrong' });
  } else {
   resp.send({ result, auth: token });
  }
 });
});

app.post('/login', async (req, resp) => {
 if (req.body.email && req.body.password) {
  let user = await User.findOne(req.body).select('-password');
  if (user) {
   Jwt.sign({ user }, jwtKey, { expiresIn: '2h' }, (err, token) => {
    if (err) {
     resp.send({ result: 'Something Went wrong' });
    } else {
     resp.send({ user, auth: token });
    }
   });
  } else {
   resp.send({ result: 'No User Found' });
  }
 } else {
  resp.send({ result: 'No User Found' });
 }
});

app.post('/add-product', async (req, resp) => {
 let product = new Product(req.body);
 let result = await product.save();
 resp.send(result);
});

app.get('/products', async (req, resp) => {
 let products = await product.find();
 if (products.length > 0) {
  resp.send(products);
 } else {
  resp.send({ result: 'No Products found' });
 }
});
app.delete('/product/:id', async (req, resp) => {
 const result = await Product.deleteOne({ _id: req.params.id });
 resp.send(result);
});
app.get('/product/:id', async (req, resp) => {
 const result = await Product.findOne({ _id: req.params.id });
 if (result) {
  resp.send(result);
 } else {
  resp.send('No Result Found for Update');
 }
});
app.put('/product/:id', async (req, resp) => {
 const result = await Product.updateOne(
  { _id: req.params.id },
  { $set: req.body }
 );
 if (result) {
  resp.send(result);
 } else {
  resp.send('No product Updated');
 }
});
app.get('/search/:key', async (req, resp) => {
 let result = await product.find({
  $or: [
   { name: { $regex: req.params.key } },
   { company: { $regex: req.params.key } },
   { category: { $regex: req.params.key } },
  ],
 });
 resp.send(result);
});

app.listen(5000);
