package com.example.invoice.service.interfaces;

import com.example.invoice.domain.BusinessSettings;
import com.example.invoice.dto.request.BusinessSettingsRequest;

public interface BusinessSettingsService
{
    BusinessSettings get();
    BusinessSettings update(BusinessSettingsRequest request);
}
