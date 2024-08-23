CREATE TABLE IF NOT EXISTS "project-review_review" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"project_id" varchar(50) NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project-review_review" ADD CONSTRAINT "project-review_review_project_id_project-review_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project-review_project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
