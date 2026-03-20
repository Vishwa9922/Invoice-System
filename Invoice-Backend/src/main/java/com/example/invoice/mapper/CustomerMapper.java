package com.example.invoice.mapper;

import com.example.invoice.domain.Customer;
import com.example.invoice.dto.request.CustomerRequest;
import com.example.invoice.dto.response.CustomerResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface CustomerMapper
{
    CustomerResponse toResponse(Customer customer);

    Customer toEntity(CustomerRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(CustomerRequest request, @MappingTarget Customer customer);
}
