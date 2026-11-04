-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "business_commands" (
    "command_key" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_commands_pkey" PRIMARY KEY ("command_key")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "source_event_id" UUID NOT NULL,
    "preview" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "read_at" TIMESTAMPTZ(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "workspace_id" UUID,
    "actor_id" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "payload" JSONB NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "position" BIGSERIAL NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_inbox" ON "notifications"("recipient_id", "workspace_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "notification_page_recipient" ON "notifications"("recipient_id", "created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_recipient_id_source_event_id_type_key" ON "notifications"("recipient_id", "source_event_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_position" ON "outbox_events"("position");

-- CreateIndex
CREATE INDEX "outbox_pending" ON "outbox_events"("position") WHERE (published_at IS NULL);


-- Domain invariants enforced by PostgreSQL.
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_schema_version_check" CHECK (schema_version > 0);
