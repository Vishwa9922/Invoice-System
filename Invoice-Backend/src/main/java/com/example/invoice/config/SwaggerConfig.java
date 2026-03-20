package com.example.invoice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI invoiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Invoice & POS API")
                        .version("1.0.0")
                        .description("Invoicing and Point of Sale REST API")
                        .contact(new Contact()
                                .name("Invoice App")
                                .email("admin@invoice.com")));
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule()); // LocalDateTime serialize support
        return mapper;
    }
}