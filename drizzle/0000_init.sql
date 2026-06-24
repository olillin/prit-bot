CREATE TABLE "activities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"type" varchar DEFAULT 'Custom' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovered_reactions" (
	"guildId" integer NOT NULL,
	"reactionId" integer NOT NULL,
	"userSnowflake" bigint NOT NULL,
	CONSTRAINT "discovered_reactions_guildId_reactionId_pk" PRIMARY KEY("guildId","reactionId"),
	CONSTRAINT "discovered_reactions_userSnowflake_unique" UNIQUE("userSnowflake")
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "guilds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"snowflake" bigint NOT NULL,
	"announceChannel" varchar,
	"responsibleRole" varchar,
	"responsibleResponsibleRole" varchar,
	"responsibleCalendarUrl" varchar,
	"announceTime" integer,
	"remindTime" integer,
	"noReactChannels" varchar[] DEFAULT ARRAY[]::varchar[] NOT NULL,
	"mutedUsers" varchar[] DEFAULT ARRAY[]::varchar[] NOT NULL,
	CONSTRAINT "guilds_snowflake_unique" UNIQUE("snowflake")
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"pattern" varchar NOT NULL,
	"emoji" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"guildId" integer NOT NULL,
	"day" smallint NOT NULL,
	"message" varchar
);
--> statement-breakpoint
ALTER TABLE "discovered_reactions" ADD CONSTRAINT "discovered_reactions_guildId_guilds_id_fk" FOREIGN KEY ("guildId") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovered_reactions" ADD CONSTRAINT "discovered_reactions_reactionId_reactions_id_fk" FOREIGN KEY ("reactionId") REFERENCES "public"."reactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_guildId_guilds_id_fk" FOREIGN KEY ("guildId") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;