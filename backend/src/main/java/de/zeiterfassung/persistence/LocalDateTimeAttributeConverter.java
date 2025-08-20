package de.zeiterfassung.persistence;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Persist LocalDateTime as ISO-like TEXT (yyyy-MM-dd HH:mm:ss.SSS) for SQLite and read it back reliably.
 * Also tolerates legacy numeric epoch-millis strings by converting them to UTC LocalDateTime.
 */
@Converter(autoApply = true)
public class LocalDateTimeAttributeConverter implements AttributeConverter<LocalDateTime, String> {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    private static final DateTimeFormatter FMT_NO_MILLIS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public String convertToDatabaseColumn(LocalDateTime attribute) {
        return attribute == null ? null : FMT.format(attribute);
    }

    @Override
    public LocalDateTime convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) return null;

        // Preferred format with milliseconds
        try {
            return LocalDateTime.parse(dbData, FMT);
        } catch (Exception ignore) { /* fall through */ }

        // Accept without milliseconds
        try {
            return LocalDateTime.parse(dbData, FMT_NO_MILLIS);
        } catch (Exception ignore) { /* fall through */ }

        // Accept ISO_LOCAL_DATE_TIME with 'T'
        try {
            return LocalDateTime.parse(dbData, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception ignore) { /* fall through */ }

        // Fallback: tolerate pure digits representing epoch millis
        boolean allDigits = true;
        for (int i = 0; i < dbData.length(); i++) {
            if (!Character.isDigit(dbData.charAt(i))) { allDigits = false; break; }
        }
        if (allDigits) {
            try {
                long ms = Long.parseLong(dbData);
                return LocalDateTime.ofInstant(Instant.ofEpochMilli(ms), ZoneOffset.UTC);
            } catch (Exception ignore) { /* fall through */ }
        }

        // Last resort: return null to avoid hard failures; callers should handle missing timestamps
        return null;
    }
}
