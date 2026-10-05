package com.splittrip.common.api;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class SpaControllerTest {

    @Test
    void forwardsFrontendRoutesToTheSinglePageApplication() {
        assertEquals("forward:/index.html", new SpaController().frontend());
    }
}
