const express = require("express");
const app = express();

// get credentials and redirect URLS
const creds_json = require("./creds/creds.json");
const redirect_urls = require("./creds/redirect_url.json");

console.log(
  "Your Stripe API secret key is: " + creds_json["STRIPE_API_SECRET"]
);

const stripe = require("stripe")(creds_json["STRIPE_API_SECRET"]);

app.get("/api", (req, res) => {
  const apiKey = req.query.apiKey;

  res.send({
    name: "test data from justin morrow",
    age: 99999,
  });
});

app.post("/checkout", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: "price_1KkFIGCfzTar7WrbisfcW3KI",
      },
    ],
    success_url: redirect_urls["STRIPE_PAYMENT_SUCCESS_URL"],
    cancel_url: redirect_urls["STRIPE_PAYMENT_CANCEL_URL"],
  });

  res.send(session);
});

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let data;
    let eventType;

    // Check if webhook signing is configured.
    // const webhookSecret = creds_json["STRIPE_WEBHOOK_SECRET"];
    const webhookSecret =
      "whsec_f027c0156c8546f65e5b428daeb642577d67ad25b059e7eec5ed7a4fa39f7caf"; // THIS IS A TESTING WEBHOOK. NOT A SECURITY ISSUE

    if (webhookSecret) {
      let event;
      let signature = req.headers["stripe-signature"];

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } catch (err) {
        console.log(
          "Webhook signature verification failed for the following reason:\n\n" +
            err.message
        );
        return res.sendStatus(400);
      }

      data = event.data;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data;
      eventType = req.body.type;
    }

    switch (eventType) {
      case "checkout.session.completed":
        const customerId = data.object["customer"];
        const subscriptionId = data.object["subscription"];
        console.log("🔔  Payment received!");
        console.log("Customer ID: " + customerId);
        console.log("Subscription ID: " + subscriptionId + "\n");
        break;
      case "invoice.paid":
        console.log("🔔  Invoice paid!");
        break;
      case "invoice.payment_failed":
        console.log("🔔  Invoice payment failed!");
        break;
      default:
      // unhandled
    }
  }
);

app.listen(8080, () => console.log("listening on port 8080"));
