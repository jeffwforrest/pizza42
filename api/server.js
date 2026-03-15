require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { auth } = require("express-oauth2-jwt-bearer");

const app = express();

app.use(cors());
app.use(express.json());

const checkJwt = auth({
  audience: "https://api.pizza42.com/orders",
  issuerBaseURL: "https://dev-u6zif485ysb275zb.us.auth0.com/",
  tokenSigningAlg: "RS256"
});

let orders = [];

app.post("/orders", checkJwt, (req, res) => {

  console.log("JWT payload:", req.auth.payload);

  const order = req.body.order;
  orders.push(order);

  res.json({
    message: "Order placed",
    orders
  });
});

app.get("/orders", checkJwt, (req, res) => {
  res.json({ orders });
});
app.delete("/orders", (req, res) => {
  orders = [];
  res.json({ message: "All orders cleared" });
});
app.listen(4000, () => {
  console.log("Orders API running on http://localhost:4000");
});