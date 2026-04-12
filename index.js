import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();
mongoose.connect(process.env.MONGO_URL);
const bot = new Telegraf(process.env.BOT_TOKEN);

// 📦 fake DB (in-memory)
const userData = {};
const bookings = {};

// 🗓 available time slots
const allSlots = ["10:00", "12:00", "14:00", "16:00"];

// START
bot.start((ctx) => {
  userData[ctx.from.id] = {};

  ctx.reply(
    "💈 Welcome to our Barbershop!\n\nChoose a service:",
    Markup.keyboard([["✂️ Haircut", "🧔 Beard Trim"]]).resize()
  );
});

// SERVICE
bot.hears(["✂️ Haircut", "🧔 Beard Trim"], (ctx) => {
  userData[ctx.from.id].service = ctx.message.text;

  const today = getToday();

  ctx.reply(
    `📅 Select a date:\n\nToday: ${today}`,
    Markup.keyboard([[today]]).resize()
  );
});

// DATE SELECTION
bot.hears(/^\d{4}-\d{2}-\d{2}$/, (ctx) => {
  const date = ctx.message.text;
  userData[ctx.from.id].date = date;

  const freeSlots = getFreeSlots(date);

  ctx.reply(
    `⏰ Available times for ${date}:`,
    Markup.keyboard(
      freeSlots.length ? freeSlots.map((t) => [t]) : [["No available slots"]]
    ).resize()
  );
});

// TIME SELECTION
bot.hears(["10:00", "12:00", "14:00", "16:00"], (ctx) => {
  userData[ctx.from.id].time = ctx.message.text;

  ctx.reply("👤 Please enter your name:", Markup.removeKeyboard());
});

// FINAL STEP
bot.on("text", async (ctx) => {
  const id = ctx.from.id;
  const data = userData[id];

  if (!data) return;

  if (data.service && data.date && data.time && !data.name) {
    data.name = ctx.message.text;

    // save booking
    if (!bookings[data.date]) bookings[data.date] = [];
    bookings[data.date].push(data.time);

    const msg =
      `📅 New Booking\n\n` +
      `👤 Name: ${data.name}\n` +
      `💈 Service: ${data.service}\n` +
      `📆 Date: ${data.date}\n` +
      `⏰ Time: ${data.time}`;

    ctx.reply("✅ Booking confirmed! 💈");

    await ctx.telegram.sendMessage(process.env.ADMIN_ID, msg);

    console.log("Booking:", data);

    userData[id] = {};
    return;
  }

  ctx.reply("Please follow the booking steps 💈");
});

// 🧠 helpers
function getToday() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function getFreeSlots(date) {
  const booked = bookings[date] || [];
  return allSlots.filter((slot) => !booked.includes(slot));
}

bot.launch();
console.log("💈 Calendar Barbershop Bot is running...");
