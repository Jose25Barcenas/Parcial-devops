package com.sion.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class PaginatedResponse<T> {
    private List<T> data;
    private int page;
    private int limit;
    private long total;
    private int pages;
}
