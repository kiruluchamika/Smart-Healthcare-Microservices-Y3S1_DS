package com.smarthealthcare.auth_service.dto.admin;

import jakarta.validation.constraints.NotNull;

public class AdminUserStatusUpdateRequest {
    @NotNull(message = "Enabled status is required")
    private Boolean enabled;

    @NotNull(message = "Account lock status is required")
    private Boolean accountNonLocked;

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Boolean getAccountNonLocked() {
        return accountNonLocked;
    }

    public void setAccountNonLocked(Boolean accountNonLocked) {
        this.accountNonLocked = accountNonLocked;
    }
}
