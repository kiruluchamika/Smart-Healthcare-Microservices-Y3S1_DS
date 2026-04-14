package com.smarthealthcare.doctor_service.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DoctorSchemaReconciler {

    private static final Logger LOGGER = LoggerFactory.getLogger(DoctorSchemaReconciler.class);

    private final JdbcTemplate jdbcTemplate;

    public DoctorSchemaReconciler(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void reconcileProfilePictureColumn() {
        try {
            jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_picture_url LONGTEXT NULL");
        } catch (Exception ex) {
            LOGGER.debug("Skipping profile_picture_url add-column reconciliation: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE doctors MODIFY COLUMN profile_picture_url LONGTEXT NULL");
        } catch (Exception ex) {
            LOGGER.warn("Unable to reconcile doctors.profile_picture_url column type. {}", ex.getMessage());
        }
    }
}
