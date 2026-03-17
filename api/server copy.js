require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { auth } = require("express-oauth2-jwt-bearer");

const app = express();
app.use(cors());
app.use(express.json());

const checkJwt = auth({
  audience: "https://api.pizza42.com/orders",
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256"
});

// Get Management API token
const getManagementToken = async () => {
  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AUTH0_M2M_CLIENT_ID,
      client_secret: process.env.AUTH0_M2M_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`
    })
  });
  const data = await response.json();
  return data.access_token;
};

let orders = [];

app.post("/orders", checkJwt, async (req, res) => {
  console.log("JWT payload:", JSON.stringify(req.auth.payload, null, 2));

  const permissions = req.auth?.payload?.permissions || [];
  if (!permissions.includes("create:orders")) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const emailVerified =
    req.auth?.payload?.email_verified ||
    req.auth?.payload?.['https://pizza42.com/email_verified'];

  if (!emailVerified) {
    return res.status(403).json({ message: "Email not verified. Please verify your email before placing an order." });
  }

  const order = req.body.order;
  const userId = req.auth.payload.sub;

  try {
    // Get management token
    const mgmtToken = await getManagementToken();

    // Get existing user metadata
    const userRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${mgmtToken}` }
    });
    const userData = await userRes.json();
    const existingOrders = userData.app_metadata?.orders || [];

    // Save updated orders to Auth0 profile
    await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${mgmtToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        app_metadata: {
          orders: [...existingOrders, order]
        }
      })
    });

    orders.push(order);
    res.json({ message: "Order placed", orders: [...existingOrders, order] });

  } catch (err) {
    console.error("Error saving order:", err);
    res.status(500).json({ message: "Order placed but failed to save to profile" });
  }
});

app.get("/orders", checkJwt, (req, res) => {
  res.json({ orders });
});

app.listen(4000, () => {
  console.log("Orders API running on http://localhost:4000");
});