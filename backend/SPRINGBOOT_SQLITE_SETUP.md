# Spring Boot SQLite Konfiguration

Füge die folgenden Abhängigkeiten in deine `pom.xml` ein:

```xml
<dependency>
    <groupId>org.xerial</groupId>
    <artifactId>sqlite-jdbc</artifactId>
    <version>3.45.3.0</version>
    </dependency>
<dependency>
    <groupId>com.github.gwenn</groupId>
    <artifactId>sqlite-dialect</artifactId>
    <version>0.1.2</version>
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

# Schema-Initialisierung
# Spring führt beim Start `schema.sql` in `src/main/resources` aus
```
Hinweis: Für SQLite ist ein spezieller Dialekt nötig. Nutze z. B. [github.com/gwenn/sqlite-dialect](https://github.com/gwenn/sqlite-dialect), da Hibernate keinen offiziellen SQLite-Dialekt mitliefert.
