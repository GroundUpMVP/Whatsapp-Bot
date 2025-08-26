import {Client} from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import OpenAI from "openai";

const openAiClient = new OpenAI();

// Create a new client instance
const client = new Client({});

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Client is ready!");
});

// When the client received QR-Code
client.on("qr", (qr) => {
  qrcode.generate(qr, {small: true});
});

client.on("message_create", async (message) => {
    // Handle the message using the OpenAI client

    const response = await openAiClient.responses.create({
      model: "gpt-5",
      input: "Write a short bedtime story about a unicorn.",
    });

    console.log(response.output_text);
});

// Start your client
client.initialize();
