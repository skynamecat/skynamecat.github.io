# syntax=docker/dockerfile:1.7

FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /workspace

# Resolve dependencies before copying sources so normal source changes reuse the
# Maven dependency layer.
COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 \
    mvn --batch-mode --no-transfer-progress dependency:go-offline

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn --batch-mode --no-transfer-progress -DskipTests package \
    && test -f target/testproject-backend.jar

FROM eclipse-temurin:21-jre-jammy AS runtime

RUN apt-get update \
    && apt-get install --yes --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 spring \
    && useradd --system --uid 10001 --gid spring --home-dir /app spring

WORKDIR /app
COPY --from=build --chown=spring:spring \
    /workspace/target/testproject-backend.jar /app/application.jar

USER spring:spring
EXPOSE 8080

ENTRYPOINT ["java", "-XX:+ExitOnOutOfMemoryError", "-jar", "/app/application.jar"]
