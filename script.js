const TelegramApi = require("node-telegram-bot-api");

const token = "7005376389:AAFvbU95NWUppbBVSKVTi_222vBVrhhKEH0";

const bot = new TelegramApi(token, { polling: true });

const fs = require("fs").promises;

const DB_FILE = "index.json";

const getDataBase = async () => {
  try {
    const data = await fs.readFile(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Ошибка чтения файла:", error);
    return { vilki: {} }; // Возвращаем пустую базу, если файл не найден
  }
};

const setDataBase = async (newData) => {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(newData, null, 2));
    console.log("Данные успешно записаны!");
  } catch (error) {
    console.error("Ошибка записи:", error);
  }
};

// в зависимости от введенной команды вызывает нужную функцию с нужными параметрами
const mapping = {
  "/calculatevilkicashback": {
    properties: { name: "vilki", cashbackPercent: 0.15, calculate: true },
    handler: askForSum,
  },
  "/calculatelazycashback": {
    properties: { name: "lazy", cashbackPercent: 0.03, calculate: true },
    handler: askForSum,
  },
  "/showvilkicashback": {
    properties: { name: "vilki" },
    handler: showCashback,
  },
  "/showlazycashback": {
    properties: { name: "lazy" },
    handler: showCashback,
  },
  "/substractvilkicashback": {
    properties: { name: "vilki" },
    handler: substractCashback,
  },
  "/substractlazycashback": {
    properties: { name: "lazy" },
    handler: substractCashback,
  },
  buttonVilki: {
    handler: showVilkiMenu,
  },
  buttonLazy: {
    handler: showLazyMenu,
  },
};

bot.setMyCommands([
  { command: "start", description: "Привет!" },
  {
    command: "showvilkicashback",
    description: "Получить кешбек из Вилки Палки",
  },
  {
    command: "calculatevilkicashback",
    description: "Посчитать кешбек из Вилки Палки",
  },
  {
    command: "substractvilkicashback",
    description: "Потратить кешбек из Вилки Палки",
  },
  { command: "showlazycashback", description: "Получить кешбек из LazyCrazy" },
  {
    command: "calculatelazycashback",
    description: "Посчитать кешбек из LazyCrazy",
  },
  {
    command: "substractlazycashback",
    description: "Потратить кешбек из LazyCrazy",
  },
]);

// кнопки
const buttonDelievery = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Вилки палки", callback_data: "buttonVilki" }],
      [{ text: "LazyCrazy", callback_data: "buttonLazy" }],
    ],
  }),
};

const vilkiAction = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Показать кешбек", callback_data: "/showvilkicashback" }],
      [{ text: "Посчитать кешбек ", callback_data: "/calculatevilkicashback" }],
      [{ text: "Потратить кешбек ", callback_data: "/substractvilkicashback" }],
    ],
  }),
};

const lazyAction = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Показать кешбек", callback_data: "/showlazycashback" }],
      [{ text: "Посчитать кешбек ", callback_data: "/calculatelazycashback" }],
      [{ text: "Потратить кешбек ", callback_data: "/substractlazycashback" }],
    ],
  }),
};

//функция для получения и подсчета кешбека, delievery определяется как динамическая переменная,
// получаемая из введенной пользователем команды
function hadleSum(properties, bot) {
  // const chatId = msg.chat.id;
  // const username = msg.from.username;

  bot.once("message", async (msg) => {
    let sum = parseFloat(+msg.text);

    const chatId = msg.chat.id;
    const username = msg.from.username;

    // если сообщение пользователя - не цифра, выдаст сообщение об ошибке и снова запросит сумму
    // заказа
    if (isNaN(sum) || sum <= 0 || false) {
      bot.sendMessage(chatId, "Некорректная сумма. Введи число.");
      return hadleSum(properties, bot);
    }

    try {
      const dataBase = await getDataBase();

      if (properties.calculate) {
        const cashback = Math.round(sum * properties.cashbackPercent);
        dataBase[properties.name][username] += cashback;
      } else {
        if (sum > dataBase[properties.name][username]) {
          bot.sendMessage(
            chatId,
            "Нельзя потратить больше чем имеешь. Введи корректную сумму."
          );
          return hadleSum(properties, bot);
        }
        dataBase[properties.name][username] -= sum;
      }

      await setDataBase(dataBase);

      bot.sendMessage(
        chatId,
        `Твой кешбек составляет ${dataBase[properties.name][username]}`
      );
    } catch (error) {
      console.error("Ошибка обработки кешбека:", error);
      bot.sendMessage(chatId, "Произошла ошибка, попробуй еще раз.");
    }
  });
}

function askForSum(properties, bot, chatId, username) {
  if (properties.calculate) {
    bot
      .sendMessage(chatId, "Напиши сумму заказа")
      .then(() => hadleSum(properties, bot, username));
  } else {
    bot
      .sendMessage(chatId, "Напиши сумму потраченного кешбека")
      .then(() => hadleSum(properties, bot, username));
  }
}

async function showCashback(properties, bot, chatId, username) {
  try {
    const dataBase = await getDataBase();

    bot.sendMessage(
      chatId,
      `Твой кешбек составляет ${dataBase[properties.name][username]}`
    );
  } catch (error) {
    console.error("Ошибка обработки кешбека:", error);
    bot.sendMessage(chatId, "Произошла ошибка, попробуй еще раз.");
  }
}

async function substractCashback(properties, bot, chatId, username) {
  askForSum(properties, bot, chatId, username);
}

bot.on("message", async (msg) => {
  const { text } = msg;
  const chatId = msg.chat.id;
  const username = msg.from.username;

  // записывает в базу данных новых юзеров
  // if (!dataBase[username]) {
  //   dataBase[username] = 0;
  // }

  if (text === `/start` && username === `StasBakryu`) {
    await bot.sendMessage(chatId, `Привет, кабанчик`);
    return bot.sendMessage(chatId, `Какой кешбек показать?`, buttonDelievery);
  }

  if (text === `/start`) {
    await bot.sendMessage(chatId, `Привет, ${msg.from.first_name}`);
    return bot.sendMessage(chatId, `Какой кешбек показать?`, buttonDelievery);
  }

  // в mapping подставляется текст из сообщения пользователя(тут: команда) и так получаются
  // данные объектов из mapping, а значит - зависимость результатов от команды
  // const delievery = mapping[(text)];

  // если пользователь ввел не команду, функция закончит свое действие, если все правильно, будет
  // вызвана функция через mapping.команда.properties.handler
  // if (delievery) {
  //   delievery.handler();
  // };

  const delievery = mapping[text];
  if (delievery) {
    delievery.handler(delievery.properties, bot, chatId, username);
  }

  // return bot.sendPhoto(
  //   chatId,
  //   `https://pbs.twimg.com/media/CTRxeF5UsAAE8hl.jpg`
  // );
});

function showVilkiMenu(properties, bot, chatId) {
  return bot.sendMessage(chatId, "Что ты хочешь сделать?", vilkiAction);
}

function showLazyMenu(properties, bot, chatId) {
  return bot.sendMessage(chatId, "Что ты хочешь сделать?", lazyAction);
}

// прослушивание кнопок
bot.on("callback_query", (msg) => {
  // msg.data - вытаскиваем название кнопки
  const data = msg.data;
  const username = msg.from.username;
  const chatId = msg.message.chat.id;

  const delievery = mapping[data];

  delievery.handler(delievery.properties, bot, chatId, username);
});

bot.on("polling_error", (error) =>
  console.log(`Polling error: ${error.message}`)
);
