# Contributing

Thank you for your interest in contributing to the P.R.I.T. Discord bot!

Not sure how you can help? Check out the
[Issues page](https://github.com/olillin/prit-bot/issues) for things that need
working on, or ask Cal directly.

Reporting bugs and suggesting new features is always welcome, please create an
issue to do so!

## Starting the bot in development

1. Create a Discord bot
    - Create a new application in the [Discord Developer Portal](https://discord.com/developers/applications).
    - On the Bot page, enable the **Server members** and
      **Message content** intents.
    - On the Installation page, add the `application.commands` and `bot` scopes
      and the **Send Messages**, **Manage Roles** and **Mention Everyone**
      permissions.

2. Open the `.env` file and add the bot token from the Discord Developer Portal
   after `TOKEN=`. It should have been created automatically after running
   `pnpm install`. If not, copy `.env.example`.

3. Create three JSON files with an empty JSON object in them (`{}`):
    - `data.json`
    - `activities.json`
    - `reactions.json`

4. Run the development compose file to start the database:

    ```console
    docker compose up -d
    ```

5. Build the bot and start it when you make changes:

    ```console
    pnpm build
    pnpm startenv
    ```
