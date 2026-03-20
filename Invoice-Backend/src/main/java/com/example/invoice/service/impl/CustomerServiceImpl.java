package com.example.invoice.service.impl;

import com.example.invoice.domain.Customer;
import com.example.invoice.dto.request.CustomerRequest;
import com.example.invoice.dto.response.CustomerResponse;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.exception.DuplicateResourceException;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.mapper.CustomerMapper;
import com.example.invoice.repository.CustomerRepository;
import com.example.invoice.service.interfaces.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CustomerServiceImpl implements CustomerService
{
    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    @Override
    public CustomerResponse create(CustomerRequest request) {
        if (customerRepository.existsByMobileNumber(request.getMobileNumber())) {
            throw new DuplicateResourceException(
                    "Customer already exists with mobile: " + request.getMobileNumber());
        }
        Customer saved = customerRepository.save(customerMapper.toEntity(request));
        log.info("Customer created: {}", saved.getId());
        return customerMapper.toResponse(saved);
    }

    @Override
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = findCustomerById(id);
        if (!customer.getMobileNumber().equals(request.getMobileNumber()) &&
                customerRepository.existsByMobileNumber(request.getMobileNumber())) {
            throw new DuplicateResourceException(
                    "Mobile number already in use: " + request.getMobileNumber());
        }
        customerMapper.updateEntity(request, customer);
        return customerMapper.toResponse(customerRepository.save(customer));
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getById(Long id) {
        return customerMapper.toResponse(findCustomerById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CustomerResponse> findByMobile(String mobileNumber) {
        return customerRepository.findByMobileNumber(mobileNumber)
                .map(customerMapper::toResponse);
    }

    @Override
    public CustomerResponse getOrCreate(String mobileNumber, String name) {
        return customerRepository.findByMobileNumber(mobileNumber)
                .map(customerMapper::toResponse)
                .orElseGet(() -> {
                    log.info("New customer — creating for mobile: {}", mobileNumber);
                    Customer newCustomer = Customer.builder()
                            .mobileNumber(mobileNumber)
                            .name(name)
                            .build();
                    return customerMapper.toResponse(customerRepository.save(newCustomer));
                });
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> getAll(int page, int size) {
        Page<Customer> result = customerRepository.findAll(PageRequest.of(page, size));
        return buildPageResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> search(String keyword, int page, int size) {
        Page<Customer> result = customerRepository
                .findByNameContainingIgnoreCaseOrMobileNumberContaining(
                        keyword, keyword, PageRequest.of(page, size));
        return buildPageResponse(result);
    }

    private Customer findCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
    }

    private PageResponse<CustomerResponse> buildPageResponse(Page<Customer> page) {
        return PageResponse.<CustomerResponse>builder()
                .content(page.getContent().stream().map(customerMapper::toResponse).toList())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
