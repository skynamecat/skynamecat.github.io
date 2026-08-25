package com.skynamecat.testproject.observability;

import java.util.UUID;

public final class RequestTraceContext {
    private static final ThreadLocal<State> CURRENT = new ThreadLocal<>();

    private RequestTraceContext() { }

    public static void begin(UUID requestId) { CURRENT.set(new State(requestId)); }

    public static UUID requestId() {
        State state = CURRENT.get();
        return state == null ? UUID.randomUUID() : state.requestId;
    }

    public static void attachSession(UUID sessionId) {
        State state = CURRENT.get();
        if (state != null) state.sessionId = sessionId;
    }

    public static UUID sessionId() {
        State state = CURRENT.get();
        return state == null ? null : state.sessionId;
    }

    public static void clear() { CURRENT.remove(); }

    private static final class State {
        private final UUID requestId;
        private UUID sessionId;

        private State(UUID requestId) { this.requestId = requestId; }
    }
}
