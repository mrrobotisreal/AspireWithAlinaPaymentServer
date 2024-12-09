const express = require("express");
const https = require("https");
const fs = require("fs");
const bodyParser = require("body-parser");
const Stripe = require("stripe");
require("dotenv").config();

const options = {
  cert: fs.readFileSync("/etc/letsencrypt/live/aspirewithalina.com/fullchain.pem"),
  key: fs.readFileSync("/etc/letsencrypt/live/aspirewithalina.com/privkey.pem"),
};
const app = express();
const PORT = 7777;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});
const lessonPackages = [
  { id: "1_lesson", name: "1 Lesson", price: 2 }, // $40 per lesson, $40 total, changed for testing
  { id: "3_lessons", name: "3 Lessons", price: 2 }, // $38 per lesson, $114 total
  { id: "6_lessons", name: "6 Lessons", price: 2 }, // $35 per lesson, $210 total
  { id: "12_lessons", name: "12 Lessons", price: 2 }, // $30 per lesson, $360 total
];

app.use(bodyParser.json());

app.post("/create-payment-intent", async (req, res) => {
  const { packageId } = req.body;

  const selectedPackage = lessonPackages.find((pkg) => pkg.id === packageId);
  if (!selectedPackage) {
    res.status(400).send("Invalid package ID");
    return;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: selectedPackage.price * 100,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(`Payment intent creation failed: ${error.message}`);
    res.status(500).send("An error occurred while creating the payment intent");
  }
});

https.createServer(options, app).listen(PORT, () => {
  console.log(`Server is running securely on https://aspirewithalina.com:${PORT}`);
});
