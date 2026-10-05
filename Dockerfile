FROM node:22-alpine AS frontend-build
WORKDIR /workspace/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:21-jdk-alpine AS backend-build
WORKDIR /workspace
COPY backend/ ./backend/
COPY --from=frontend-build /workspace/frontend/dist/ ./backend/src/main/resources/static/
RUN chmod +x backend/mvnw && ./backend/mvnw -f backend/pom.xml --batch-mode -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S splittrip && adduser -S splittrip -G splittrip
COPY --from=backend-build /workspace/backend/target/*.jar app.jar
USER splittrip
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
