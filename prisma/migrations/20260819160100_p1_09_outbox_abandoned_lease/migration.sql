-- P1-09 follow-up: an expired worker lease is itself immutable delivery
-- evidence. Reclaim increments the delivery attempt and appends this outcome
-- before the next worker receives the message.

ALTER TYPE "OutboxDeliveryOutcome" ADD VALUE 'ABANDONED';
