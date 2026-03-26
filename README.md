# Smart Healthcare Microservices - Auth + Frontend Docker Integration

This guide connects your React frontend to `auth-service` using Docker, and explains the architecture clearly for microservice beginners.

## 1. What You Have Now

This setup runs 3 containers:

1. `mysql-auth`: MySQL database for auth data
2. `auth-service`: Spring Boot service exposing auth APIs
3. `frontend`: React app served by Nginx

Traffic flow:

- Browser -> `http://localhost:5173`
- Frontend calls `/api/auth/...`
- Nginx (inside frontend container) proxies `/api/auth/*` -> `http://auth-service:8080/auth/*`

Important point:
Frontend does **not** need to know Docker internal URLs. It only calls `/api/auth/...` on the same host.

## 2. Why This Pattern Is Good For Microservices

In a microservice project:

- Services communicate over internal Docker network by service name (`auth-service`, `mysql-auth`)
- Browser cannot directly resolve internal Docker names
- A reverse proxy (Nginx/API Gateway) exposes a clean public path

So you hide internal complexity and keep frontend simple.

## 3. Auth Endpoints Implemented

Base path: `/auth`

1. `POST /auth/register`
2. `POST /auth/login`
3. `GET /auth/health`

Register request body:

```json
{
	"email": "user@example.com",
	"password": "StrongPass1!",
	"firstName": "John",
	"lastName": "Doe",
	"role": "PATIENT"
}
```

Login request body:

```json
{
	"email": "user@example.com",
	"password": "StrongPass1!"
}
```

Success response shape:

```json
{
	"accessToken": "...jwt...",
	"tokenType": "Bearer",
	"expiresInMs": 900000,
	"user": {
		"id": 1,
		"email": "user@example.com",
		"firstName": "John",
		"lastName": "Doe",
		"phoneNumber": null,
		"role": "PATIENT"
	}
}
```

## 4. Run Everything With Docker

From project root:

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:5173`
- Auth health: `http://localhost:8080/auth/health`

Stop:

```bash
docker compose down
```

Stop and remove DB volume (fresh database):

```bash
docker compose down -v
```

## 5. Verify End-to-End Quickly

1. Open frontend at `http://localhost:5173`
2. Go to Sign Up and create account
3. Go to Sign In with same credentials
4. On success, token and user are stored in browser localStorage

## 6. Common Beginner Questions

### Why MySQL is not localhost inside auth-service?

Inside Docker, `localhost` means the same container. Auth and MySQL are different containers. So auth must use:

`jdbc:mysql://mysql-auth:3306/auth_service_db...`

### Why frontend calls `/api/auth` and not `http://auth-service:8080`?

`auth-service` hostname exists only inside Docker network, not in browser DNS. Browser talks to frontend host, then Nginx forwards internally.

### Do I still need CORS?

For this Docker route, browser sees same origin (`localhost:5173`), so CORS pain is reduced. `auth-service` still has a CORS config for flexibility.

## 7. Files Added/Updated For Integration

- Docker orchestrator: `docker-compose.yml`
- Auth service Docker image: `services/auth-service/Dockerfile`
- Frontend Docker image + proxy: `frontend/Dockerfile`, `frontend/nginx.conf`
- Auth backend API/security/service: under `services/auth-service/src/main/java/com/smarthealthcare/auth_service/...`
- Frontend API client and forms: `frontend/src/services/authApi.ts`, `frontend/src/components/LoginForm.tsx`, `frontend/src/components/RegisterForm.tsx`

## 8. Next Steps (Recommended)

1. Add JWT authentication filter and protect non-public endpoints.
2. Move all frontend API traffic through a dedicated API Gateway service.
3. Add refresh token flow and logout invalidation.
4. Add integration tests for register/login.

