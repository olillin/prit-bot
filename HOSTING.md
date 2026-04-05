# Hosting

This document explains how to host your own instance of the P.R.I.T. Discord
bot. For instructions about how to add the official bot to your server, see
[Installing](README.md#installing) in the README.

## Prerequisites

To run the bot you need Docker compose, see the
[official installation guide](https://docs.docker.com/compose/install).

## Setup

1. Create a Discord bot
    - Create a new application in the [Discord Developer Portal](https://discord.com/developers/applications).
    - On the Bot page, enable the **Server members** and
      **Message content** intents.
    - On the Installation page, add the `application.commands` and `bot` scopes
      and the **Send Messages**, **Manage Roles** and **Mention Everyone**
      permissions.

2. Copy the `compose.yaml` file from this repository into a new directory.

3. Open the file and replace the comment after `TOKEN: ` with the bot token
   from the Discord Developer Portal.

4. Create three JSON files with an empty JSON object in them (`{}`):
    - `data.json`
    - `activities.json`
    - `reactions.json`

5. Then run the compose file:

    ```console
    docker compose up
    ```
