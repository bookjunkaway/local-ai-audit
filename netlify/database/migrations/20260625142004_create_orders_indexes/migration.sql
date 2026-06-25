CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_number" text NOT NULL UNIQUE,
	"product_slug" text NOT NULL,
	"product_label" text NOT NULL,
	"fulfillment" text DEFAULT 'custom' NOT NULL,
	"download_url" text,
	"status" text DEFAULT 'new' NOT NULL,
	"business" text NOT NULL,
	"website" text NOT NULL,
	"city" text NOT NULL,
	"service" text NOT NULL,
	"platform" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"competitors" text,
	"pages" text,
	"notes" text,
	"source" text DEFAULT 'intake_form' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"notification_status" text DEFAULT 'pending' NOT NULL,
	"notification_error" text,
	"customer_notification_status" text DEFAULT 'pending' NOT NULL,
	"customer_notification_error" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_notified_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" ("email");--> statement-breakpoint
CREATE INDEX "orders_submitted_at_idx" ON "orders" ("submitted_at");--> statement-breakpoint
CREATE INDEX "orders_notification_status_idx" ON "orders" ("notification_status");