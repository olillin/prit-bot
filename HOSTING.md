# Hosting

This document explains how to host your own instance of the P.R.I.T. Discord
bot. For instructions about how to add the official bot to your server, see
[Installing](README.md#installing) in the README.

## Prerequisites

To run the bot you must have Node.js installed, you can download it from the
[Node.js downloads page](https://nodejs.org/en/download).

## Setup

1. Create a Discord bot
    - Create a new application in the [Discord Developer Portal](https://discord.com/developers/applications).
    - On the Bot page, enable the **Server members** and
      **Message content** intents.
    - On the Installation page, add the `application.commands` and `bot` scopes
      and the **Send Messages**, **Manage Roles** and **Mention Everyone**
      permissions.

2. Clone the repository and install dependencies:

    ```console
    git clone https://github.com/olillin/prit-bot
    cd prit-bot
    npm install
    ```

3. Create a `.env` file and copy the contents from `.env.example`. Paste the bot
    token from the Discord Developer Portal.

4. Build the bot:

    ```console
    npm run build
    ```

5. Run the bot with the environment file:

    ```console
    npm run startenv
    ```
