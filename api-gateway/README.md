# API Gateway (Common Module)

This module is the shared edge gateway for microservices.

## Current Phase

- Implemented routes:
  - `/api/doctors/**` -> doctor-service `/api/v1/doctors/**`
  - `/api/ai/**` -> ai-doctor-suggestion-service `/api/v1/ai/**`

## How Other Members Add Their Service

1. Add a new route block in `src/main/resources/application.yaml`.
2. Use external path format `/api/{service}/**`.
3. Map to internal service URL and add rewrite when backend base path differs.
4. Do not strip or overwrite `Authorization` header.
5. Add a quick smoke test using gateway URL.

## Route Contribution Template

```yaml
- id: <service-name>
  uri: ${<SERVICE_URL_ENV>:http://host.docker.internal:<PORT>}
  predicates:
    - Path=/api/<service>/**
  filters:
    - RewritePath=/api/<service>/(?<segment>.*), /<internal-base>/${segment}
```

## PR Checklist

- Route entry added
- Rewrite validated
- Auth behavior unchanged
- Gateway endpoint tested (success + unauthorized path as applicable)

## IDE Auto-Compose Mode (No Manual Docker Compose)

The gateway can auto-start required containers when run from the IDE.

1. Run doctor-service from IDE on port 8083.
2. Run api-gateway from IDE.
3. Spring Boot auto-starts `api-gateway/docker-compose.yaml` (AI service + MySQL).
4. Test through gateway:

- `http://localhost:8088/api/doctors`
- `http://localhost:8088/api/ai/suggest-doctor`

Notes:

- AI container calls doctor-service through `http://host.docker.internal:8083`.
- This mode is for local development. Team-wide integration can still use root compose.
