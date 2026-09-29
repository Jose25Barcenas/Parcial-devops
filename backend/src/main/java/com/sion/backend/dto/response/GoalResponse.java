package com.sion.backend.dto.response;

import com.sion.backend.model.Goal;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GoalResponse {
    private String id;
    private String key;
    private String label;
    private Double target;
    private String unit;
    private String period;
    private LocalDateTime updatedAt;

    public static String unitForKey(String key) {
        return switch (key) {
            case "revenue" -> "currency";
            case "admissionRate" -> "percent";
            default -> "count";
        };
    }

    public static GoalResponse fromGoal(Goal goal) {
        GoalResponse res = new GoalResponse();
        res.setId(goal.getId());
        res.setKey(goal.getKey());
        res.setLabel(goal.getLabel());
        res.setTarget(goal.getTarget());
        res.setUnit(unitForKey(goal.getKey()));
        res.setPeriod(goal.getPeriod());
        res.setUpdatedAt(goal.getUpdatedAt());
        return res;
    }
}
