CREATE TABLE IF NOT EXISTS "project-review_project" (
	"repository" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	CONSTRAINT "repo_and_user" UNIQUE("repository","user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project-review_project" ADD CONSTRAINT "project-review_project_user_id_project-review_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."project-review_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
