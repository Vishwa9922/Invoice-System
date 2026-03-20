package com.example.invoice.service.interfaces;

import com.example.invoice.dto.request.CustomerRequest;
import com.example.invoice.dto.response.CustomerResponse;
import com.example.invoice.dto.response.PageResponse;

import java.util.Optional;

public interface CustomerService
{
    CustomerResponse create(CustomerRequest request);
    CustomerResponse update(Long id, CustomerRequest request);
    CustomerResponse getById(Long id);
    Optional<CustomerResponse> findByMobile(String mobileNumber);
    CustomerResponse getOrCreate(String mobileNumber, String name); // used by POS
    PageResponse<CustomerResponse> getAll(int page, int size);
    PageResponse<CustomerResponse> search(String keyword, int page, int size);
}
