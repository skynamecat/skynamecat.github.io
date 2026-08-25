package com.skynamecat.testproject.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Principal;
import java.util.UUID;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    private final RequestLogRepository repository;

    public RequestLoggingFilter(RequestLogRepository repository) { this.repository = repository; }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(path.startsWith("/api/") || path.equals("/manage") || path.startsWith("/manage/"))
                || path.startsWith("/manage/assets/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        UUID requestId = UUID.randomUUID();
        long startedAt = System.nanoTime();
        RequestTraceContext.begin(requestId);
        response.setHeader("X-Request-Id", requestId.toString());
        try {
            chain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
            try {
                Principal principal = request.getUserPrincipal();
                repository.save(new RequestLog(
                        requestId,
                        RequestTraceContext.sessionId(),
                        principal == null ? null : principal.getName(),
                        request.getMethod(),
                        truncate(request.getRequestURI(), 500),
                        response.getStatus(),
                        durationMs,
                        truncate(request.getRemoteAddr(), 64),
                        truncate(request.getHeader("User-Agent"), 500)
                ));
            } catch (RuntimeException exception) {
                log.warn("Could not persist request trace {}", requestId, exception);
            } finally {
                RequestTraceContext.clear();
            }
        }
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) return value;
        return value.substring(0, maxLength);
    }
}
