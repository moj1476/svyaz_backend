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
CREATE TABLE "conversation_members" (
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "joined_seq" BIGINT NOT NULL,
    "last_read_seq" BIGINT NOT NULL,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "visibility" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 1,
    "created_by" UUID,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_revisions" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "revision_no" BIGINT NOT NULL,
    "body" TEXT,
    "edited_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "message_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "sequence" BIGINT NOT NULL,
    "body" TEXT,
    "status" TEXT NOT NULL,
    "thread_root_id" UUID,
    "sent_at" TIMESTAMPTZ(6) NOT NULL,
    "edited_at" TIMESTAMPTZ(6),
    "version" BIGINT NOT NULL DEFAULT 1,
    "client_message_id" UUID,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "reactions" (
    "message_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "emoji" TEXT NOT NULL,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("message_id","user_id","emoji")
);

-- CreateIndex
CREATE INDEX "conversation_member_reader" ON "conversation_members"("user_id", "status", "conversation_id");

-- CreateIndex
CREATE INDEX "conversation_page_workspace" ON "conversations"("workspace_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "message_revisions_message_id_revision_no_key" ON "message_revisions"("message_id", "revision_no");

-- CreateIndex
CREATE INDEX "messages_history" ON "messages"("conversation_id", "sequence");

-- CreateIndex
CREATE INDEX "messages_page_sent" ON "messages"("conversation_id", "sent_at", "id");

-- CreateIndex
CREATE INDEX "messages_thread" ON "messages"("thread_root_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "messages_client_id" ON "messages"("conversation_id", "client_message_id") WHERE (client_message_id IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "messages_conversation_id_sequence_key" ON "messages"("conversation_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_position" ON "outbox_events"("position");

-- CreateIndex
CREATE INDEX "outbox_pending" ON "outbox_events"("position") WHERE (published_at IS NULL);

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "message_revisions" ADD CONSTRAINT "message_revisions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_root_id_fkey" FOREIGN KEY ("thread_root_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;


-- Domain invariants enforced by PostgreSQL.
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_schema_version_check" CHECK (schema_version > 0);
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_version_check" CHECK (version > 0);
ALTER TABLE "messages" ADD CONSTRAINT "messages_version_check" CHECK (version > 0);
