package com.example.invoice.mapper;

import com.example.invoice.domain.InvoiceItem;
import com.example.invoice.dto.response.InvoiceItemResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InvoiceItemMapper
{
    @Mapping(source = "product.id", target = "productId")
    InvoiceItemResponse toResponse(InvoiceItem item);
}
