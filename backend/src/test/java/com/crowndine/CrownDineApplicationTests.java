package com.crowndine;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class CrownDineApplicationTests {
    @Test
    void contextLoads() {
    }
//    ./mvnw -Ptest clean test
}
