package com.swp391.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Filter giới hạn tần suất truy cập (Rate Limiting) theo địa chỉ IP của Client
 * Sử dụng thuật toán Token Bucket (In-Memory) độc lập, không yêu cầu cài đặt Redis ngoài.
 */
@Component
public class RateLimiterGatewayFilterFactory extends AbstractGatewayFilterFactory<RateLimiterGatewayFilterFactory.Config> {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterGatewayFilterFactory.class);

    private final Map<String, TokenBucket> clientBuckets = new ConcurrentHashMap<>();

    public RateLimiterGatewayFilterFactory() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String clientIp = resolveClientIp(request);

            TokenBucket bucket = clientBuckets.computeIfAbsent(
                    clientIp,
                    ip -> new TokenBucket(config.getBurstCapacity(), config.getReplenishRate())
            );

            if (bucket.tryConsume(1)) {
                exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", String.valueOf((long) bucket.getTokens()));
                exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(config.getBurstCapacity()));
                return chain.filter(exchange);
            }

            log.warn("Rate limit exceeded for client IP: {} on path: {}", clientIp, request.getURI().getPath());

            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
            response.getHeaders().add("X-RateLimit-Limit", String.valueOf(config.getBurstCapacity()));
            response.getHeaders().add("X-RateLimit-Remaining", "0");
            response.getHeaders().add("Retry-After", "1");

            String errorJson = """
                    {
                      "status": 429,
                      "error": "Too Many Requests",
                      "message": "Quá giới hạn tần suất yêu cầu (Rate Limit Exceeded). Vui lòng thử lại sau giây lát.",
                      "clientIp": "%s"
                    }
                    """.formatted(clientIp);

            DataBuffer buffer = response.bufferFactory().wrap(errorJson.getBytes(StandardCharsets.UTF_8));
            return response.writeWith(Mono.just(buffer));
        };
    }

    private String resolveClientIp(ServerHttpRequest request) {
        HttpHeaders headers = request.getHeaders();
        String xForwardedFor = headers.getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        InetSocketAddress remoteAddress = request.getRemoteAddress();
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            return remoteAddress.getAddress().getHostAddress();
        }
        return "unknown";
    }

    public static class Config {
        private double replenishRate = 20.0; // Tokens hồi phục mỗi giây
        private double burstCapacity = 40.0; // Sức chứa tối đa của bucket

        public double getReplenishRate() {
            return replenishRate;
        }

        public void setReplenishRate(double replenishRate) {
            this.replenishRate = replenishRate;
        }

        public double getBurstCapacity() {
            return burstCapacity;
        }

        public void setBurstCapacity(double burstCapacity) {
            this.burstCapacity = burstCapacity;
        }
    }

    /**
     * Thuật toán Token Bucket thread-safe
     */
    static class TokenBucket {
        private final double capacity;
        private final double refillRate;
        private double tokens;
        private long lastRefillTimestamp;

        public TokenBucket(double capacity, double refillRate) {
            this.capacity = capacity;
            this.refillRate = refillRate;
            this.tokens = capacity;
            this.lastRefillTimestamp = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume(int count) {
            refill();
            if (tokens >= count) {
                tokens -= count;
                return true;
            }
            return false;
        }

        public synchronized double getTokens() {
            refill();
            return tokens;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            double secondsPassed = (now - lastRefillTimestamp) / 1000.0;
            if (secondsPassed > 0) {
                tokens = Math.min(capacity, tokens + secondsPassed * refillRate);
                lastRefillTimestamp = now;
            }
        }
    }
}
