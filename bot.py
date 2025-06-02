import telebot
from telebot import types
import json
import os
from datetime import datetime
import requests
import sqlite3

# Инициализация бота
BOT_TOKEN = "7844292897:AAHvXWEYIx6gtDz3Uuk5ff9foKUK68BFOVs"
ADMIN_ID = 7642453177
bot = telebot.TeleBot(BOT_TOKEN)

# Создание базы данных
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (user_id INTEGER PRIMARY KEY,
                  username TEXT,
                  ip_address TEXT,
                  registration_date TEXT,
                  address TEXT,
                  password TEXT,
                  is_blocked INTEGER DEFAULT 0)''')
    conn.commit()
    conn.close()

# Функция для получения IP адреса
def get_ip():
    try:
        response = requests.get('https://api.ipify.org?format=json')
        return response.json()['ip']
    except:
        return "Не удалось получить IP"

# Обработчик команды /start
@bot.message_handler(commands=['start'])
def start(message):
    if message.from_user.id == ADMIN_ID:
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("Показать пользователей", callback_data="show_users"))
        bot.send_message(message.chat.id, "Добро пожаловать в панель администратора!", reply_markup=markup)
    else:
        bot.send_message(message.chat.id, "У вас нет доступа к этой команде.")

# Обработчик регистрации пользователя
def register_user(user_id, username, ip, address, password):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    registration_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute("INSERT OR REPLACE INTO users (user_id, username, ip_address, registration_date, address, password) VALUES (?, ?, ?, ?, ?, ?)",
              (user_id, username, ip, registration_date, address, password))
    conn.commit()
    conn.close()

# Обработчик callback-запросов
@bot.callback_query_handler(func=lambda call: True)
def callback_handler(call):
    if call.from_user.id != ADMIN_ID:
        bot.answer_callback_query(call.id, "У вас нет доступа к этой функции.")
        return

    if call.data == "show_users":
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("SELECT * FROM users")
        users = c.fetchall()
        conn.close()

        for user in users:
            user_id, username, ip, reg_date, address, password, is_blocked = user
            markup = types.InlineKeyboardMarkup()
            if is_blocked:
                markup.add(types.InlineKeyboardButton("Разблокировать", callback_data=f"unblock_{user_id}"))
            else:
                markup.add(types.InlineKeyboardButton("Заблокировать", callback_data=f"block_{user_id}"))

            message = f"ID: {user_id}\n"
            message += f"Имя: {username}\n"
            message += f"IP: {ip}\n"
            message += f"Дата регистрации: {reg_date}\n"
            message += f"Адрес: {address}\n"
            message += f"Пароль: {password}\n"
            message += f"Статус: {'Заблокирован' if is_blocked else 'Активен'}"

            bot.send_message(call.message.chat.id, message, reply_markup=markup)

    elif call.data.startswith("block_"):
        user_id = int(call.data.split("_")[1])
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("UPDATE users SET is_blocked = 1 WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()
        bot.answer_callback_query(call.id, "Пользователь заблокирован")
        bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id,
                                    reply_markup=types.InlineKeyboardMarkup().add(
                                        types.InlineKeyboardButton("Разблокировать", callback_data=f"unblock_{user_id}")
                                    ))

    elif call.data.startswith("unblock_"):
        user_id = int(call.data.split("_")[1])
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("UPDATE users SET is_blocked = 0 WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()
        bot.answer_callback_query(call.id, "Пользователь разблокирован")
        bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id,
                                    reply_markup=types.InlineKeyboardMarkup().add(
                                        types.InlineKeyboardButton("Заблокировать", callback_data=f"block_{user_id}")
                                    ))

# Функция для проверки блокировки пользователя
def is_user_blocked(user_id):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT is_blocked FROM users WHERE user_id = ?", (user_id,))
    result = c.fetchone()
    conn.close()
    return result[0] if result else 0

# Запуск бота
if __name__ == "__main__":
    init_db()
    print("Бот запущен...")
    bot.polling(none_stop=True) 