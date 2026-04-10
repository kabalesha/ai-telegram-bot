import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// память пользователя (очень простая)
const userData = {};

// START
bot.start((ctx) => {
  userData[ctx.from.id] = {};

  ctx.reply(
    "💈 Добро пожаловать в наш барбершоп!\n\nВыберите услугу:",
    Markup.keyboard([["✂️ Стрижка", "🧔 Борода"]]).resize()
  );
});

// УСЛУГА
bot.hears(["✂️ Стрижка", "🧔 Борода"], (ctx) => {
  userData[ctx.from.id].service = ctx.message.text;

  ctx.reply(
    `Вы выбрали: ${ctx.message.text}\n\nВыберите время:`,
    Markup.keyboard([
      ["10:00", "12:00"],
      ["14:00", "16:00"],
    ]).resize()
  );
});

// ВРЕМЯ
bot.hears(["10:00", "12:00", "14:00", "16:00"], (ctx) => {
  userData[ctx.from.id].time = ctx.message.text;

  ctx.reply(
    `Время выбрано: ${ctx.message.text}\n\nТеперь напишите своё имя 👇`,
    Markup.removeKeyboard()
  );
});

// ИМЯ → АДРЕС
bot.on("text", (ctx) => {
  const id = ctx.from.id;
  const data = userData[id];

  if (!data || !data.time) return;

  data.name = ctx.message.text;

  ctx.reply(
    `✅ Запись создана!\n\n👤 Имя: ${data.name}\n💈 Услуга: ${data.service}\n⏰ Время: ${data.time}\n📍 Адрес: Stockholm, Main Street 12\n\nЖдём вас! 💈`
  );

  console.log("Новая запись:", data);

  userData[id] = {}; // очищаем
});

bot.launch();

console.log("Bot is running...");
