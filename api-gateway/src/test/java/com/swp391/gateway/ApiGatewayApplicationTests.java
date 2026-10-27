package com.swp391.gateway;

import com.swp391.gateway.filter.RateLimiterGatewayFilterFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class ApiGatewayApplicationTests {

    @Autowired
    private RateLimiterGatewayFilterFactory rateLimiterFilterFactory;

    @Test
    @DisplayName("1. Kiem tra Spring Application Context khoi dong thanh cong")
    void contextLoads() {
        assertNotNull(rateLimiterFilterFactory);
    }

    @Test
    @DisplayName("2. Kiem tra Rate Limiter chan request vuot nguong va tra ve HTTP 429")
    void testRateLimiterRejection() {
        RateLimiterGatewayFilterFactory.Config config = new RateLimiterGatewayFilterFactory.Config();
        config.setBurstCapacity(2.0); // Cho phep toi da 2 request
        config.setReplenishRate(0.0); // Khong hoi phuc de test limit

        GatewayFilter filter = rateLimiterFilterFactory.apply(config);
        GatewayFilterChain dummyChain = exchange -> Mono.empty();

        MockServerHttpRequest req1 = MockServerHttpRequest.get("/api/facilities").remoteAddress(new java.net.InetSocketAddress("192.168.1.100", 1234)).build();
        MockServerWebExchange ex1 = MockServerWebExchange.from(req1);

        MockServerHttpRequest req2 = MockServerHttpRequest.get("/api/facilities").remoteAddress(new java.net.InetSocketAddress("192.168.1.100", 1234)).build();
        MockServerWebExchange ex2 = MockServerWebExchange.from(req2);

        MockServerHttpRequest req3 = MockServerHttpRequest.get("/api/facilities").remoteAddress(new java.net.InetSocketAddress("192.168.1.100", 1234)).build();
        MockServerWebExchange ex3 = MockServerWebExchange.from(req3);

        // Request 1: Passed
        StepVerifier.create(filter.filter(ex1, dummyChain)).verifyComplete();
        assertNull(ex1.getResponse().getStatusCode());

        // Request 2: Passed
        StepVerifier.create(filter.filter(ex2, dummyChain)).verifyComplete();
        assertNull(ex2.getResponse().getStatusCode());

        // Request 3: Rejected with 429
        StepVerifier.create(filter.filter(ex3, dummyChain)).verifyComplete();
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex3.getResponse().getStatusCode());
        assertEquals("0", ex3.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"));
    }
}
