package com.swp391.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Filter toàn cục (Global Filter) cho API Gateway:
 * - Gán và chuyển tiếp X-Request-Id để truy vết phân tán (Distributed Tracing)
 * - Ghi nhận nhật ký truy cập (Access Log) và thời gian phản hồi (Latency)
 * - Thêm header định danh Gateway
 */
@Component
public class LoggingGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(LoggingGlobalFilter.class);
    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    private static final String START_TIME_ATTR = "gatewayStartTime";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // Đảm bảo mỗi request đều có Request ID duy nhất
        String requestId = request.getHeaders().getFirst(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        final String finalRequestId = requestId;
        ServerHttpRequest mutatedRequest = request.mutate()
                .header(REQUEST_ID_HEADER, finalRequestId)
                .build();

        long startTime = System.currentTimeMillis();
        exchange.getAttributes().put(START_TIME_ATTR, startTime);

        log.info("[GATEWAY-IN] [{}] {} {} from {}",
                finalRequestId,
                mutatedRequest.getMethod(),
                mutatedRequest.getURI().getPath(),
                mutatedRequest.getRemoteAddress());

        ServerWebExchange mutatedExchange = exchange.mutate()
                .request(mutatedRequest)
                .build();

        // Gắn header trả về cho Client
        mutatedExchange.getResponse().getHeaders().add(REQUEST_ID_HEADER, finalRequestId);
        mutatedExchange.getResponse().getHeaders().add("X-Gateway-Server", "SelfStorage-API-Gateway");

        return chain.filter(mutatedExchange).then(Mono.fromRunnable(() -> {
            Long start = mutatedExchange.getAttribute(START_TIME_ATTR);
            long duration = (start != null) ? (System.currentTimeMillis() - start) : 0;
            var statusCode = mutatedExchange.getResponse().getStatusCode();

            log.info("[GATEWAY-OUT] [{}] {} {} -> Status: {} ({}ms)",
                    finalRequestId,
                    mutatedRequest.getMethod(),
                    mutatedRequest.getURI().getPath(),
                    statusCode != null ? statusCode.value() : "UNKNOWN",
                    duration);
        }));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
