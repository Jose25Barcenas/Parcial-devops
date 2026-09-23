FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/sion-backend-*.jar app.jar
RUN mkdir -p /app/uploads
EXPOSE 3000
ENTRYPOINT ["java", "-jar", "app.jar"]
