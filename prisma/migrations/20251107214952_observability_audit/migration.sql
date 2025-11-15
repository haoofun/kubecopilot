-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."ApiRequestCategory" AS ENUM ('K8S', 'AI');

-- CreateTable
CREATE TABLE "public"."OperationPlan" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "aiRationale" TEXT NOT NULL,
    "resourceKind" TEXT NOT NULL,
    "resourceNamespace" TEXT NOT NULL,
    "resourceName" TEXT NOT NULL,
    "resourceUid" TEXT,
    "resourceVersion" TEXT,
    "resourceCluster" TEXT,
    "resourceHref" TEXT NOT NULL,
    "diffBefore" JSONB,
    "diffPatch" JSONB NOT NULL,
    "diffPatchFormat" TEXT NOT NULL,
    "diffRollbackPatch" JSONB,
    "riskLevel" TEXT NOT NULL,
    "riskRationale" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION,
    "riskFactors" JSONB NOT NULL,
    "riskSloBudgetImpact" TEXT,
    "riskPostConditions" JSONB NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "confirmedBy" TEXT,
    "executedBy" TEXT,
    "idempotencyKey" TEXT,
    "sourcePromptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "revertedAt" TIMESTAMP(3),

    CONSTRAINT "OperationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OperationPlanStep" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "patch" JSONB,
    "rollbackPatch" JSONB,

    CONSTRAINT "OperationPlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditEvent" (
    "id" TEXT NOT NULL,
    "planId" TEXT,
    "type" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiRequestLog" (
    "id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "durationMs" INTEGER,
    "category" "public"."ApiRequestCategory" NOT NULL,
    "actor" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."OperationPlanStep" ADD CONSTRAINT "OperationPlanStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."OperationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditEvent" ADD CONSTRAINT "AuditEvent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."OperationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

