const Pusher = require("pusher");
const mongoose = require("mongoose");
const RequestsCar = require("./models/requestCars");

let pusher;

function initializePusher() {
  pusher = new Pusher({
    appId: "1826287",
    key: "ea80cde6e77453dc1bf5",
    secret: "c60a75a7c8986c98f0a5",
    cluster: "mt1",
    useTLS: true,
  });

  return pusher;
}


async function createAmbulanceRequest  (req, res)  {
  try {
    const newRequest = await RequestsCar.create(req.body);

    pusher.trigger("newRequestCar-channel", "newRequestCar", newRequest); // Emit event using Pusher

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Error creating ambulance request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports = {
  initializePusher,
  createAmbulanceRequest
};
