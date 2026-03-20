package com.example.invoice.mapper;

import com.example.invoice.domain.Category;
import com.example.invoice.dto.request.CategoryRequest;
import com.example.invoice.dto.response.CategoryResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface CategoryMapper
{
    CategoryResponse toResponse(Category category);

    Category toEntity(CategoryRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(CategoryRequest request, @MappingTarget Category category);
}
