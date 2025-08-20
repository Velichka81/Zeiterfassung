package de.zeiterfassung.persistence;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Persist LocalDate as ISO-8601 text (yyyy-MM-dd) in SQLite and read it back reliably.
 * Also tolerates legacy numeric epoch-millis strings by converting them to UTC LocalDate.
 */
@Converter(autoApply = true)
public class LocalDateAttributeConverter implements AttributeConverter<LocalDate, String> {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    @Override
    public String convertToDatabaseColumn(LocalDate attribute) {
        return attribute == null ? null : FMT.format(attribute);
    }

    @Override
    public LocalDate convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) return null;
        // Prefer ISO yyyy-MM-dd
        try {
            return LocalDate.parse(dbData, FMT);
        } catch (Exception ignore) { /* fall through */ }

        // Fallback: tolerate pure digits representing epoch millis
        if (dbData.chars().allMatch(Character::isDigit)) {
            try {
                long ms = Long.parseLong(dbData);
                return Instant.ofEpochMilli(ms).atZone(ZoneOffset.UTC).toLocalDate();
            } catch (Exception ignore) { /* fall through */ }
        }

        // Last resort: let Java parse a few common patterns
        try {
            return LocalDate.parse(dbData);
        } catch (Exception e) {
            // If unparseable, return null to avoid hard failures; callers should handle missing dates
            return null;
        }
    }
}
