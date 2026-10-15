package com.swp391.selfstorage.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PolicyAnalyticsService {

    private final Map<String, Object> pricingPolicies = new LinkedHashMap<>();
    private final Map<String, Object> chainStats = new LinkedHashMap<>();

    public PolicyAnalyticsService() {
        // Khung giá niêm yết mặc định
        Map<String, Long> basePrices = new LinkedHashMap<>();
        basePrices.put("S", 800000L);
        basePrices.put("M", 1450000L);
        basePrices.put("L", 2800000L);
        basePrices.put("CLIMATE", 2200000L);

        Map<Integer, Double> durationDiscounts = new LinkedHashMap<>();
        durationDiscounts.put(3, 0.05);
        durationDiscounts.put(6, 0.10);
        durationDiscounts.put(12, 0.15);

        Map<String, Long> extraFees = new LinkedHashMap<>();
        extraFees.put("cleaning", 200000L);
        extraFees.put("newLock", 150000L);
        extraFees.put("overduePenaltyPerDay", 50000L);

        pricingPolicies.put("basePrices", basePrices);
        pricingPolicies.put("depositRule", "1_MONTH");
        pricingPolicies.put("durationDiscounts", durationDiscounts);
        pricingPolicies.put("extraFees", extraFees);

        // Thống kê chuỗi chi nhánh toàn quốc
        chainStats.put("totalBranches", 5);
        chainStats.put("totalUnits", 560);
        chainStats.put("occupiedUnits", 432);
        chainStats.put("availableUnits", 128);
        chainStats.put("occupancyRate", "77.1%");
        chainStats.put("monthlyRevenue", 648500000L);
        chainStats.put("heldDepositFunds", 626400000L);
    }

    public Map<String, Object> getPricingPolicies() {
        return pricingPolicies;
    }

    public Map<String, Object> updatePricingPolicies(Map<String, Object> updates) {
        if (updates != null) {
            pricingPolicies.putAll(updates);
        }
        return pricingPolicies;
    }

    public Map<String, Object> getChainStats() {
        return chainStats;
    }
}
