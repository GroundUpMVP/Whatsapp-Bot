import { Client } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import OpenAI from "openai";

const openAiClient = new OpenAI();

// Track chats: phone → { lastResponseId, messages[] }
const conversations: Record<string, { lastResponseId?: string; messages: string[] }> = {};

const client = new Client({
  puppeteer: {
    headless: true,
    executablePath: Bun.env.PUPPETEER_EXECUTABLE_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.once("ready", () => {
  console.log("Client is ready!");
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("message_create", async (message) => {
  try {
    if (message.fromMe) return; // Ignore self
    if (message.from.endsWith("@g.us")) return; // Ignore groups

    // Ensure conversation exists for this user
    if (!conversations[message.from]) {
      conversations[message.from] = { messages: [] };
    }

    // Save user message
    conversations[message.from].messages.push(message.body);

    const baseInstructions = `
You are Hannah, a friendly, customer-facing AI assistant for GroundUp MVP, a software development agency. 
GroundUp MVP helps startups and businesses go from zero to a Minimum Viable Product (MVP) in as little as 21 days. 
The company builds high-quality, scalable digital products and provides ongoing support after launch. 

🔹 What GroundUp MVP Does:
- Mobile app development (Flutter, React Native, Cordova, Java, Swift)
- Web app development (React, Next.js, Vue.js)
- Backend system development (Express.js, Hono, NestJS)
- Database design and integration (MySQL, MongoDB, PostgreSQL)
- Social media chatbots (WhatsApp, Facebook Messenger, Instagram, etc.)
- Web chatbots (integrated into websites)

🔹 Tone & Guidelines:
- Speak in a simple, customer-friendly way. 
- Avoid deep technical jargon unless the customer specifically asks for it. 
- Always frame answers in terms of how GroundUp MVP can help businesses, entrepreneurs, or startups succeed. 
- Focus on explaining benefits and outcomes, not just tools or technologies. 
- If asked, mention that GroundUp MVP typically delivers MVPs in 21 days, offers post-launch support, and provides transparent pricing.

🔹 Example Projects:
- Truefolio: A platform for creating and showcasing professional portfolios.
- Memestream: A social platform built around viral meme sharing.
- Tangabiz: An e-commerce platform helping businesses sell products online.

Your role is to answer customer inquiries, explain what GroundUp MVP offers, help them choose the right package (Starter, Standard, Business), and encourage them to book a call with the team. 
Always stay helpful, professional, and approachable.
    `;

    // Prepare request
    const request: any = {
      model: "gpt-5",
      input: message.body,
    };

    // First message → include instructions
    if (!conversations[message.from].lastResponseId) {
      request.instructions = baseInstructions;
    } else {
      request.previous_response_id = conversations[message.from].lastResponseId;
    }

    // Call OpenAI
    const response = await openAiClient.responses.create(request);

    const reply = response.output_text || "Sorry, I didn’t understand that.";

    // Save AI response id for continuity
    conversations[message.from].lastResponseId = response.id;

    // Save AI reply
    conversations[message.from].messages.push(reply);

    // Send reply
    await client.sendMessage(message.from, reply);

  } catch (error) {
    console.error("Error handling message:", error);
  }
});

client.initialize();