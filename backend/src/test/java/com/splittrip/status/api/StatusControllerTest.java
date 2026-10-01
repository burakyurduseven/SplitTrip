package com.splittrip.status.api;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class StatusControllerTest {

    @Test
    void returnsOkStatus() {
        var response = new StatusController().status();

        assertEquals(200, response.getStatusCode().value());
        assertEquals("ok", response.getBody().status());
    }
}
