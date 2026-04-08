package com.example.invoice.service.impl;

import com.example.invoice.domain.Supplier;
import com.example.invoice.dto.request.SupplierRequest;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.SupplierResponse;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.repository.SupplierRepository;
import com.example.invoice.service.interfaces.SupplierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SupplierServiceImpl implements SupplierService
{
    private final SupplierRepository supplierRepository;

    @Override
    public SupplierResponse create(SupplierRequest request) {
        Supplier supplier = Supplier.builder()
                .name(request.getName())
                .contactPerson(request.getContactPerson())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .gstNumber(request.getGstNumber())
                .active(true)
                .build();
        return toResponse(supplierRepository.save(supplier));
    }

    @Override
    public SupplierResponse update(Long id, SupplierRequest request) {
        Supplier supplier = findById(id);
        supplier.setName(request.getName());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setPhone(request.getPhone());
        supplier.setEmail(request.getEmail());
        supplier.setAddress(request.getAddress());
        supplier.setGstNumber(request.getGstNumber());
        if (request.getActive() != null) supplier.setActive(request.getActive());
        return toResponse(supplierRepository.save(supplier));
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SupplierResponse> getAll(int page, int size, String search) {
        Page<Supplier> result = search != null && !search.isBlank()
                ? supplierRepository.searchSuppliers(search, PageRequest.of(page, size))
                : supplierRepository.findByActiveTrue(PageRequest.of(page, size));
        return PageResponse.<SupplierResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).toList())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Override
    public void delete(Long id) {
        Supplier supplier = findById(id);
        supplier.setActive(false);
        supplierRepository.save(supplier);
    }

    private Supplier findById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
    }

    private SupplierResponse toResponse(Supplier s) {
        SupplierResponse r = new SupplierResponse();
        r.setId(s.getId());
        r.setName(s.getName());
        r.setContactPerson(s.getContactPerson());
        r.setPhone(s.getPhone());
        r.setEmail(s.getEmail());
        r.setAddress(s.getAddress());
        r.setGstNumber(s.getGstNumber());
        r.setActive(s.getActive());
        r.setCreatedAt(s.getCreatedAt());
        return r;
    }
}
