package com.example.invoice.service.impl;

import com.example.invoice.domain.BusinessSettings;
import com.example.invoice.dto.request.BusinessSettingsRequest;
import com.example.invoice.repository.BusinessSettingsRepository;
import com.example.invoice.service.interfaces.BusinessSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class BusinessSettingsServiceImpl implements BusinessSettingsService
{
    private final BusinessSettingsRepository settingsRepository;

    @Override
    @Transactional(readOnly = true)
    public BusinessSettings get() {
        return settingsRepository.findById(1L)
                .orElse(BusinessSettings.builder().build());
    }

    @Override
    public BusinessSettings update(BusinessSettingsRequest req) {
        BusinessSettings settings = settingsRepository
                .findById(1L).orElse(BusinessSettings.builder().build());

        if (req.getBusinessName()       != null) settings.setBusinessName(req.getBusinessName());
        if (req.getAddress()            != null) settings.setAddress(req.getAddress());
        if (req.getPhone()              != null) settings.setPhone(req.getPhone());
        if (req.getEmail()              != null) settings.setEmail(req.getEmail());
        if (req.getGstNumber()          != null) settings.setGstNumber(req.getGstNumber());
        if (req.getLogoUrl()            != null) settings.setLogoUrl(req.getLogoUrl());
        if (req.getCurrency()           != null) settings.setCurrency(req.getCurrency());
        if (req.getDefaultTaxRate()     != null) settings.setDefaultTaxRate(req.getDefaultTaxRate());
        if (req.getInvoicePrefix()      != null) settings.setInvoicePrefix(req.getInvoicePrefix());
        if (req.getLowStockAlertEnabled() != null) settings.setLowStockAlertEnabled(req.getLowStockAlertEnabled());
        if (req.getExpiryAlertDays()    != null) settings.setExpiryAlertDays(req.getExpiryAlertDays());

        return settingsRepository.save(settings);
    }
}
