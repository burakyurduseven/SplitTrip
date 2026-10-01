package com.splittrip.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {

    @Bean
    OpenAPI splitTripOpenApi() {
        return new OpenAPI().info(new Info()
                .title("SplitTrip API")
                .version("v1")
                .description("SplitTrip full-stack web application API"));
    }
}
