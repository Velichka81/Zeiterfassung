# Spring Boot SQLite Konfiguration

Füge die folgenden Abhängigkeiten in deine `pom.xml` ein:

```xml
<dependency>
    <groupId>org.xerial</groupId>
    <artifactId>sqlite-jdbc</artifactId>
    <version>3.45.3.0</version>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
```

Lege in `src/main/resources` eine Datei `application.properties` an:

```properties
spring.datasource.url=jdbc:sqlite:db/zeiterfassung.db
spring.datasource.driver-class-name=org.sqlite.JDBC
spring.datasource.username=
spring.datasource.password=
spring.jpa.database-platform=org.sqlite.hibernate.dialect.SQLiteDialect
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true

# Flyway Migrationen
spring.flyway.enabled=true
spring.flyway.locations=filesystem:db/migration
```

Lege die Migrationen im Ordner `backend/db/migration` ab.

Hinweis: Für SQLite ist ein spezieller Dialekt nötig. Nutze z. B. [github.com/gwenn/sqlite-dialect](https://github.com/gwenn/sqlite-dialect) oder eine eigene Implementierung, da Hibernate keinen offiziellen SQLite-Dialekt mitliefert.
