# P.R.I.T. Bot

This is a Discord bot developed by and for P.R.I.T. of the Software Engineering
Student Division at Chalmers.

## Installing

The bot can be added to your server by using
[this invite link](https://discordapp.com/oauth2/authorize?client_id=1344643574112714783).

Want to host the bot on your own server? See [HOSTING.md](HOSTING.md).

### Setup

The bot has a few variables which can be configured with the `/config` slash
command. Each variable in has subcommands to `get`, `set` and
`unset` respectively.

For example to set the calendar URL the command you would use is:

```plain
/config calendar set
```

Some features will not work without these variables so you are strongly
recommended to set them all after adding the bot to your server.

### Variables

Below is a table describing all the variables configurable with `/config`.

| Name                 | Subcommand      | Type          | Default | Description                                                                               |
| -------------------- | --------------- | ------------- | ------- | ----------------------------------------------------------------------------------------- |
| Calendar URL         | `calendar`      | URL           | None    | URL to the calendar which the bot reads for responsibility weeks in iCal (`.ics`) format. |
| Announcement channel | `channel`       | Text channel  | None    | Channel where the bot will send announcements and reminders.                              |
| Responsible role     | `role`          | Role          | None    | Role given to people during their responsibilty week.                                     |
| Scheduler role       | `schedulerole`  | Role          | None    | Role which identifies who is responsible for scheduling responsibility weeks.             |
| Announce time        | `announcetime`  | Time as hh:mm | 09:00   | Time when announcements are sent at the start of the week.                                |
| Reminders time       | `reminderstime` | Time as hh:mm | 13:00   | Time when reminders are sent each day.                                                    |

## Features

The bot has features that work to help P.R.I.T. with their routine work but
also to liven up the Discord server.

### Week overview

The `/vecka` command will give you information about the current week, including
the week number, study week and responsibility week info.

### Responsibility weeks

P.R.I.T. typically operates using the concept of *responsibility weeks* (sv.
ansvarsveckor) where a few people are responsible for the routine work in
Hubben.

#### Detecting responsibility weeks

For the bot to be able to find responsibility weeks the following criteria must
be met:

- The calendar URL is set. See [Variables](#variables).
- There is an ongoing event in the calendar for the responsibility week:
  - The event must be a whole week long.
  - The event summary/title must contain the word "Ansvar".
  - The rest of the event summary/title should be a comma-separated list of the names of the people who are assigned to the responsibility week.
- The name in the event must be included in the nickname or display name of that person in your Discord server.

For example an event with the name "Ansvar: Cal, Göken" will cause the bot to
look for users in the server whose nicknames include "Cal" or "Göken". This
will match a user named "Göken" but also "📅🗓️iamcal_🔥".

#### Start of week announcement

The bot will send an announcement at the start of the week which lets everyone
know that a new week has started and who has the responsibility week (or a
warning if there is no responsibility week set).

#### Scheduler reminder

If the scheduler role [variable](#variables) is set the bot will send a reminder
at the end of the week to the people with the role if there is no
responsibility week scheduled for the week after.

#### Weekly reminders

With the `/reminders add` command you can create responsibility weekk reminders that
are sent every week. The reminders are set with a weekday when they will be sent
and a message.

For example the following command will create a reminder that is sent on Mondays
reminding the people who have the responsibility week to empty the fridge:

```text
/reminders add day:Måndagar message:Töm måndagskylen
```

All reminders can be viewed with `/reminders list`.

To remove a reminder use `/reminders remove` and specify the day and index of
the reminder from the list. The index is the number before the reminder in
`/reminders list`. Keep in mind that after removing a reminder that the indexes
of the reminders after it will change.

### Message reactions

Certain *special phrases* will trigger a fun reaction to be added to the
message! If you are the first person to discover the reaction the bot will
announce this! All discovered reactions along with who discovered them can be
viewed with the `/reactions` command.

If you do not want reactions to be sent in a certain channel you can mark it
with `/noreact add`.

### @channel

Are you accustomed to Slack and using **@channel**? The bot will help you out if
you accidentally send @channel by pinging everyone for you!
