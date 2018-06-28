
export interface Event {
    id: string;
    actor_id?: string;
    object_id?: string; // a.k.a target_id
    team_id?: string;

    description: string;
    action: string;
    crud: string;
    is_failure: boolean;
    is_anonymous: boolean;
    created: Date;
    received: Date;
    source_ip: string;
    country?: string;
    loc_subdiv1?: string;
    loc_subdiv2?: string;
    raw: string;
    canonical_time: Date;
}

/**
 * abstraction around asynchronously
 * fetching events from a database and
 * feeding them to a callback function.
 */
export interface EventSource {
    iteratePaged(callback: EventConsumer): Promise<any>;
}

/**
 * EventConsumer gets an array of events and
 * returns a promise that will resolve when
 * they've been processed.
 *
 * As of writing, the only EventConsumer implementation
 * is in src/commands/reindex/postgres -- it bulk-loads
 * the events into a new elasticsearch index.
 */
export type EventConsumer = (events: Event[]) => Promise<void>;
