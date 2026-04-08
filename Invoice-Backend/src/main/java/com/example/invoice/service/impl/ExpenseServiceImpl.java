package com.example.invoice.service.impl;

import com.example.invoice.domain.Expense;
import com.example.invoice.domain.enums.ExpenseCategory;
import com.example.invoice.dto.request.ExpenseRequest;
import com.example.invoice.dto.response.ExpenseResponse;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.repository.ExpenseRepository;
import com.example.invoice.service.interfaces.ExpenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ExpenseServiceImpl implements ExpenseService
{
    private final ExpenseRepository expenseRepository;

    @Override
    public ExpenseResponse create(ExpenseRequest request) {
        Expense expense = Expense.builder()
                .title(request.getTitle())
                .category(request.getCategory())
                .amount(request.getAmount())
                .date(request.getDate())
                .note(request.getNote())
                .build();
        return toResponse(expenseRepository.save(expense));
    }

    @Override
    public ExpenseResponse update(Long id, ExpenseRequest request) {
        Expense expense = findById(id);
        expense.setTitle(request.getTitle());
        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate());
        expense.setNote(request.getNote());
        return toResponse(expenseRepository.save(expense));
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ExpenseResponse> getAll(
            String category, String from, String to, int page, int size) {

        ExpenseCategory cat = category != null
                ? ExpenseCategory.valueOf(category) : null;
        LocalDate fromDate  = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate    = to   != null ? LocalDate.parse(to)   : null;

        Page<Expense> result = expenseRepository.findWithFilters(
                cat, fromDate, toDate, PageRequest.of(page, size));

        return PageResponse.<ExpenseResponse>builder()
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
        expenseRepository.delete(findById(id));
    }

    private Expense findById(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", id));
    }

    private ExpenseResponse toResponse(Expense e) {
        ExpenseResponse r = new ExpenseResponse();
        r.setId(e.getId());
        r.setTitle(e.getTitle());
        r.setCategory(e.getCategory());
        r.setAmount(e.getAmount());
        r.setDate(e.getDate());
        r.setNote(e.getNote());
        r.setCreatedAt(e.getCreatedAt());
        return r;
    }
}
