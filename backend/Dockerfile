# syntax=docker/dockerfile:1

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml ./
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/target/*.jar /app/app.jar
# Ensure SQLite DB folder exists for jdbc:sqlite:db/zeiterfassung.db
RUN mkdir -p /app/db
EXPOSE 8082
ENTRYPOINT ["java","-jar","/app/app.jar"]
