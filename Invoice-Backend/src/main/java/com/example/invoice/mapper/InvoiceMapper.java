package com.example.invoice.mapper;

import com.example.invoice.domain.Invoice;
import com.example.invoice.dto.response.InvoiceResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = {CustomerMapper.class, InvoiceItemMapper.class})
public interface InvoiceMapper
{
    InvoiceResponse toResponse(Invoice invoice);
}
