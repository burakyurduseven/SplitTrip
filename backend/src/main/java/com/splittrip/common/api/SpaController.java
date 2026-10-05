package com.splittrip.common.api;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({"/", "/trips", "/trips/{tripId}", "/invitations/{token}"})
    String frontend() {
        return "forward:/index.html";
    }
}
