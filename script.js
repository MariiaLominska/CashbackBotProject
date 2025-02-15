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
  "/start": { handler: start },
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
  buttonReturn: {
    handler: returnMenu,
  },
  buttonUsersCashback: {
    handler: showUsersCashback,
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
const buttonDelivery = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Вилки палки", callback_data: "buttonVilki" }],
      [{ text: "Lazy Crazy", callback_data: "buttonLazy" }],
    ],
  }),
};

const buttonDeliveryAdmin = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Вилки палки", callback_data: "buttonVilki" }],
      [{ text: "Lazy Crazy", callback_data: "buttonLazy" }],
      [{ text: "Посмотреть балансы", callback_data: "buttonUsersCashback" }],
    ],
  }),
};

const vilkiAction = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Показать кешбек", callback_data: "/showvilkicashback" }],
      [{ text: "Посчитать кешбек ", callback_data: "/calculatevilkicashback" }],
      [{ text: "Потратить кешбек ", callback_data: "/substractvilkicashback" }],
      [{ text: "Вернуться к выбору доставки", callback_data: "buttonReturn" }],
    ],
  }),
};

const lazyAction = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Показать кешбек", callback_data: "/showlazycashback" }],
      [{ text: "Посчитать кешбек ", callback_data: "/calculatelazycashback" }],
      [{ text: "Потратить кешбек ", callback_data: "/substractlazycashback" }],
      [{ text: "Вернуться к выбору доставки", callback_data: "buttonReturn" }],
    ],
  }),
};

// прослушивание кнопок
bot.on("callback_query", (msg) => {
  // msg.data - вытаскиваем название кнопки
  const data = msg.data;
  const username = msg.from.username;
  const chatId = msg.message.chat.id;

  const delivery = mapping[data];

  delivery.handler(delivery.properties, bot, chatId, username);
});

bot.on("polling_error", (error) =>
  console.log(`Polling error: ${error.message}`)
);

// function hadleSum(properties, bot) {
//   bot.once("message", async (msg) => {
//     let sum = parseFloat(+msg.text);

//     const chatId = msg.chat.id;
//     const username = msg.from.username;

//     // если сообщение пользователя - не цифра, выдаст сообщение об ошибке и снова запросит сумму
//     // заказа
//     if (isNaN(sum) || sum <= 0 || false) {
//       bot.sendMessage(chatId, "Некорректная сумма. Введи число.");
//       return hadleSum(properties, bot);
//     }

//     try {
//       const dataBase = await getDataBase();

//       if (properties.calculate) {
//         const cashback = Math.round(sum * properties.cashbackPercent);
//         dataBase[properties.name][username] += cashback;
//       } else {
//         if (sum > dataBase[properties.name][username]) {
//           bot.sendMessage(
//             chatId,
//             "Нельзя потратить больше чем имеешь. Введи корректную сумму."
//           );
//           return hadleSum(properties, bot);
//         }
//         dataBase[properties.name][username] -= sum;
//       }

//       await setDataBase(dataBase);

//       bot.sendMessage(
//         chatId,
//         `Твой кешбек составляет ${dataBase[properties.name][username]}`
//       );
//     } catch (error) {
//       console.error("Ошибка обработки кешбека:", error);
//       bot.sendMessage(chatId, "Произошла ошибка, попробуй еще раз.");
//     }
//   });
// }

// function askForSum(properties, bot, chatId, username) {
//   if (properties.calculate) {
//     bot
//       .sendMessage(chatId, "Напиши сумму заказа")
//       .then(() => hadleSum(properties, bot, chatId, username));
//   } else {
//     bot
//       .sendMessage(chatId, "Напиши сумму потраченного кешбека")
//       .then(() => hadleSum(properties, bot, chatId, username));
//   }
// };

async function askForSum(properties, bot, chatId, username) {
  bot.sendMessage(chatId, "Напиши сумму").then(() => {
    bot.once("message", async (msg) => {
      let sum = parseFloat(+msg.text);

      if (isNaN(sum) || sum <= 0 || false) {
        bot.sendMessage(chatId, "Некорректная сумма. Введи число.");
        return askForSum(properties, bot, chatId, username); // Повторный вызов функции запроса суммы
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
              `Нельзя потратить больше, чем имеешь \u{261D}\u{FE0F}\u{261D}\u{FE0F}\u{261D}\u{FE0F}`
            );
            return askForSum(properties, bot, chatId, username);
          }
          dataBase[properties.name][username] -= sum;
        }

        await setDataBase(dataBase);

        bot.sendMessage(
          chatId,
          `Твой кешбек составляет ${dataBase[properties.name][username]}`
        );
      } catch (error) {
        console.error("Ошибка обработки кешбэка:", error);
        bot.sendMessage(chatId, "Произошла ошибка, попробуй еще раз.");
      }
    });
  });
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

  const delivery = mapping[text];

  if (delivery) {
    return await delivery.handler(
      delivery.properties,
      bot,
      chatId,
      username,
      text
    );
  }

  // if (msg.text === delivery || text === "Number") {
  //   return await bot.sendSticker(
  //     chatId,
  //     `CAACAgIAAxkBAAEMhkdnrdoiIcwk7nG23xljRgmLc9gfkAACHWQAAqlOcUn4tx_ROTtmejYE`
  //   );
  // }
});

const helloMessages = {
  vingriel: `Привет, повелительница`,
  StasBakryu: `Привет, кабанчик`,
};

async function start(properties, bot, chatId, username) {
  await bot.sendMessage(
    chatId,
    helloMessages[username] || `Привет, ${msg.from.first_name}`
  );
  if (username === "vingriel") {
    return bot.sendMessage(chatId, "Выбери доставку", buttonDeliveryAdmin);
  }
  return bot.sendMessage(chatId, `Выбери доставку`, buttonDelivery);
}

function showVilkiMenu(properties, bot, chatId) {
  return bot.sendMessage(chatId, "Что ты хочешь сделать?", vilkiAction);
}

function showLazyMenu(properties, bot, chatId) {
  return bot.sendMessage(chatId, "Что ты хочешь сделать?", lazyAction);
}

function returnMenu(properties, bot, chatId) {
  return bot.sendMessage(chatId, "Выбери доставку", buttonDelivery);
}

async function showUsersCashback(properties, bot, chatId, username) {
  const dataBase = await getDataBase();
  const result = Object.entries(dataBase).reduce(
    (accumulator, [companyName, users]) => {
      const usersList = JSON.stringify(users)
        .split(/[,{()}]/)
        .join("\n")
        .split(":")
        .join(" : ");
      return accumulator + companyName + ":" + usersList + "\n";
    },
    ""
  );
  return bot.sendMessage(chatId, result);
}
