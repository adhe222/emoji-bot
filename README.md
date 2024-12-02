# Auto Play Emoji Bot

This bot automates the process of logging into multiple accounts, claiming free tickets, completing quests, and playing games. It is designed to interact with the **EmojiApp API**.

## Features
- **Login to multiple accounts**
- **Claim free tickets**
- **Complete daily, one-time, and special quests**
- **Play games until all tickets are used**
- **Random User-Agent selection** to avoid detection

## Setup Instructions

first of all register here https://t.me/webemoji_bot/play?startapp=5533258750

### 1. Clone the repository

First, clone the repository from GitHub:

```bash
git clone https://github.com/adhe222/emoji-bot.git
cd emoji-bot
```

### 2. Install dependencies
The project already contains a package.json file with the necessary dependencies. To install them, run:
```bash
npm install
```

### 3. Setup QueryID
The bot needs a queryId to log in. Here’s how you can retrieve it:

Open the Telegram WebApp (or the app you are working with).
Open your browser's Developer Tools (usually F12 or Ctrl+Shift+I).
Go to the Console tab.
Paste the following code:
```bash
copy(Telegram.WebApp.initData);
```

### 4. Fill the queryId
- Paste each queryId (one per line) into hash.txt.

### 5. Run the Bot
To start the bot, simply run:
```bash
node index.js
```
