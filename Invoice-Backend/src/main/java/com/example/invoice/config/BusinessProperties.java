package com.example.invoice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.business")
@Data
public class BusinessProperties
{
    private String name    = "D'MART";
    private String address = "Hinjewadi";
    private String phone   = "9922857719";
    private String gstin   = "dfs";
    private String pan     = "dfsdffsfsfd";
}
