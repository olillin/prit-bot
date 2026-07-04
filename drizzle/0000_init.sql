CREATE TABLE "activities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"type" varchar DEFAULT 'Custom' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovered_reactions" (
	"guild_id" integer NOT NULL,
	"reaction_id" integer NOT NULL,
	"user_snowflake" bigint NOT NULL,
	CONSTRAINT "discovered_reactions_guild_id_reaction_id_pk" PRIMARY KEY("guild_id","reaction_id")
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "guilds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"snowflake" bigint NOT NULL,
	"announce_channel" bigint,
	"responsible_role" bigint,
	"responsible_responsible_role" bigint,
	"responsible_calendar_url" varchar,
	"announce_time" integer,
	"remind_time" integer,
	"no_react_channels" bigint[] DEFAULT ARRAY[]::bigint[] NOT NULL,
	"no_ping_users" bigint[] DEFAULT ARRAY[]::bigint[] NOT NULL,
	CONSTRAINT "guilds_snowflake_unique" UNIQUE("snowflake")
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"display_name" varchar NOT NULL,
	"pattern" varchar NOT NULL,
	"emoji" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reminders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"guild_id" integer NOT NULL,
	"day" smallint NOT NULL,
	"message" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discovered_reactions" ADD CONSTRAINT "discovered_reactions_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovered_reactions" ADD CONSTRAINT "discovered_reactions_reaction_id_reactions_id_fk" FOREIGN KEY ("reaction_id") REFERENCES "public"."reactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;