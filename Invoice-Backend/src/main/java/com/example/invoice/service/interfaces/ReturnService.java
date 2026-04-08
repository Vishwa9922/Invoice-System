package com.example.invoice.service.interfaces;

import com.example.invoice.dto.request.ReturnRequest;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.ReturnResponse;

public interface ReturnService
{
    ReturnResponse createReturn(ReturnRequest request);
    ReturnResponse getById(Long id);
    PageResponse<ReturnResponse> getAll(String status, String from, String to, int page, int size);
    ReturnResponse approve(Long id);
    ReturnResponse reject(Long id);
}
