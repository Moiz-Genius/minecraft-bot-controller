# 🤖 Minecraft Bot Controller

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg?logo=node.js)](https://nodejs.org/)
[![Mineflayer](https://img.shields.io/badge/Mineflayer-latest-blue.svg)](https://github.com/PrismarineJS/mineflayer)
[![Express](https://img.shields.io/badge/Dashboard-Express-orange.svg)](https://expressjs.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Moiz-Genius/minecraft-bot-controller/pulls)

A modular, high-performance Minecraft bot automation controller built with [Mineflayer](https://github.com/PrismarineJS/mineflayer). Control single or multiple bots concurrently with autonomous pathfinding, PvP combat, smart inventory management, an interactive web dashboard, and optional AI conversation routing.

---

## ✨ Features

- **Multi-Bot Management**: Spawn and synchronize multiple bots to work together on any Minecraft server.
- **Advanced Combat & Defense**:
  - Auto-PvP combat routing against players and hostile mobs.
  - Guard mode: protect areas with customizable chase/leash distance.
- **Autonomous Pathfinding & Movement**:
  - A* pathfinding via `mineflayer-pathfinder` across complex terrains.
  - Waypoint management: save and recall locations on the fly.
  - Anti-AFK routines and parkour capabilities.
- **Inventory & Survival**:
  - Auto-eating with hunger point prioritization.
  - Mining and crafting automation.
  - Tool and armor auto-equipping.
- **Real-Time Web Dashboard**: Built-in Express and Socket.IO control panel with customizable themes.
- **AI-Powered Chat**: Optional OpenRouter LLM integration for contextual in-game chat and conversational responses.
- **Proxy Support**: SOCKS proxy support for multi-bot connection distribution.

---

## 📋 Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Minecraft Server**: Compatible with Minecraft Java Edition (supports versions 1.8.x through 1.20.x)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Moiz-Genius/minecraft-bot-controller.git
cd minecraft-bot-controller
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example configuration file and adjust settings as needed:

```bash
cp .env.example .env
```

Edit `.env` to configure your server connection, dashboard credentials, and AI keys:

```env
# Optional: OpenRouter API Key for AI responses
OPENROUTER_KEYS=your_openrouter_api_key_here
DEFAULT_MODEL=openai/gpt-3.5-turbo

# Web Dashboard Settings
DASHBOARD_PORT=3000
DASHBOARD_USER=admin
DASHBOARD_PASSWORD=password123

# Minecraft Server Connection Defaults
BOT_DEFAULT_IP=localhost
BOT_DEFAULT_PORT=25565
BOT_DEFAULT_VERSION=1.20.1
```

### 4. Run the Bot Controller

```bash
npm start
# or
node index.js
```

Follow the interactive terminal prompt to specify server host, port, and number of bots to connect.

---

## 🎮 Command Reference

Bots can be controlled in real time via in-game chat using selectors.

### Command Syntax
```
<selector> <command> [arguments]
```
- `<selector>`:
  - `!bot_<index>`: Target an individual bot (e.g., `!bot_0`)
  - `@all` or `!all`: Target all connected bots simultaneously

### Combat Commands
| Command | Description | Syntax | Example |
| :--- | :--- | :--- | :--- |
| `pvp` | Attack a designated target | `!pvp <username>` | `!bot_0 pvp Steve` |
| `pvp toggle` | Toggle PvP combat mode on/off | `!pvp toggle` | `!all pvp toggle` |
| `guard` | Guard current standing location | `!guard` | `!bot_0 guard` |
| `guardrange` | Set maximum guard radius | `!guardrange <blocks>` | `!bot_0 guardrange 32` |
| `attack` | Target the nearest hostile mob | `!attack` | `!bot_0 attack` |

### Movement Commands
| Command | Description | Syntax | Example |
| :--- | :--- | :--- | :--- |
| `come` | Pathfind to the caller's location | `!come` | `!all come` |
| `follow` | Continuously follow a player | `!follow [username]` | `!bot_0 follow Alex` |
| `goto` | Pathfind to exact coordinates | `!goto <x> <y> <z>` | `!bot_0 goto 100 64 -250` |
| `stoppathfind`| Cancel active pathfinding movement | `!stoppathfind` | `!bot_0 stoppathfind` |
| `stop` | Immediately halt all bot actions | `!stop` | `!all stop` |
| `afk` | Toggle anti-AFK behavior loop | `!afk` | `!bot_0 afk` |
| `setwaypoint` | Save current coordinate as a waypoint| `!setwaypoint <name>` | `!bot_0 setwaypoint base` |
| `gotowaypoint`| Walk to a saved waypoint | `!gotowaypoint <name>` | `!bot_0 gotowaypoint base` |

### Inventory & Survival Commands
| Command | Description | Syntax | Example |
| :--- | :--- | :--- | :--- |
| `mine` | Automatically mine target block | `!mine` | `!bot_0 mine` |
| `craft` | Craft item recipe | `!craft <item> [count]` | `!bot_0 craft torch 16` |
| `equip` | Equip item into main hand/armor | `!equip <item>` | `!bot_0 equip diamond_sword` |
| `list` | Print bot inventory to chat | `!list` | `!bot_0 list` |
| `toss` | Drop specified item | `!toss <item>` | `!bot_0 toss cobblestone` |

---

## 🖥️ Web Dashboard

When the bot is running, access the web control dashboard at:
```
http://localhost:3000
```
Log in using the `DASHBOARD_USER` and `DASHBOARD_PASSWORD` configured in your `.env` file. The dashboard provides:
- Live status of all connected bots (health, food, coordinates).
- In-game chat broadcast and bot command dispatch.
- Visual theme switcher.

---

## 🔒 Security Best Practices

- **Never commit `.env` or `proxies.txt`** to source control. They are pre-configured in `.gitignore`.
- Use strong dashboard credentials when deploying to public networks or remote VPS instances.
- Ensure compliance with the rules and terms of service of the Minecraft server you connect to.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
