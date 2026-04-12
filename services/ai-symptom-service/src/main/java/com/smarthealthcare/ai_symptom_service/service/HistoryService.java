package com.smarthealthcare.ai_symptom_service.service;

import com.smarthealthcare.ai_symptom_service.dto.PagedHistoryResponse;
import com.smarthealthcare.ai_symptom_service.dto.SymptomHistoryItemResponse;
import com.smarthealthcare.ai_symptom_service.entity.SymptomAnalysisHistory;
import com.smarthealthcare.ai_symptom_service.exception.ResourceNotFoundException;
import com.smarthealthcare.ai_symptom_service.mapper.SymptomAnalysisMapper;
import com.smarthealthcare.ai_symptom_service.repository.SymptomAnalysisHistoryRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class HistoryService {

    private final SymptomAnalysisHistoryRepository repository;
    private final SymptomAnalysisMapper mapper;

    public HistoryService(SymptomAnalysisHistoryRepository repository, SymptomAnalysisMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public PagedHistoryResponse getPatientHistory(Long patientId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SymptomAnalysisHistory> historyPage = repository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable);
        List<SymptomHistoryItemResponse> items = historyPage.getContent().stream()
                .map(mapper::toHistoryItem)
                .toList();

        PagedHistoryResponse response = new PagedHistoryResponse();
        response.setItems(items);
        response.setPage(historyPage.getNumber());
        response.setSize(historyPage.getSize());
        response.setTotalElements(historyPage.getTotalElements());
        response.setTotalPages(historyPage.getTotalPages());
        return response;
    }

    public SymptomHistoryItemResponse getById(Long id) {
        SymptomAnalysisHistory item = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Symptom analysis not found for id: " + id));
        return mapper.toHistoryItem(item);
    }
}
