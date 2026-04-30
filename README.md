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

## 4.1 Run Auth-Service In Doctor-Style Local Mode

This mode is similar to doctor-service local development flow.

1. Move to auth-service folder:

```bash
cd services/auth-service
```

2. Run auth-service (Spring Boot will manage local MySQL from service compose):

```bash
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

What this does:

- Starts MySQL from `services/auth-service/docker-compose.yaml`
- Uses dedicated DB credentials `auth_user/auth_pass`
- Runs auth-service on port `8080`

Stop local mode:

- Stop the Spring app (Ctrl+C), then Spring Docker Compose lifecycle will bring down the local MySQL container.

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

## 9. Team Setup For Ollama Embeddings (AI Doctor Suggestion)

Use only these steps for every teammate.

1. Install Ollama manually from https://ollama.com/download
2. Start `doctor-service`
3. Start `ai-doctor-suggestion-service`

No extra setup is required for normal flow.

## Kubernetes Setup Instructions

The Kubernetes manifests live in `k8s/` and currently cover the backend services, API gateway, and MySQL databases. The frontend is not included in Kubernetes, so run it separately from `frontend/` with `npm run dev`.

### Build Backend Images

Run these commands from the repository root:

```bash
docker build -t auth-service:latest ./services/auth-service
docker build -t doctor-service:latest ./services/doctor-service
docker build -t patient-service:latest ./services/patient-service
docker build -t appointment-service:latest ./services/appointment-service
docker build -t payment-service:latest ./services/payment-service
docker build -t notification-service:latest ./services/notification-service
docker build -t telemedicine-service:latest ./services/telemedicine-service
docker build -t ai-symptom-service:latest ./services/ai-symptom-service
docker build -t ai-doctor-suggestion-service:latest ./services/ai-doctor-suggestion-service
docker build -t api-gateway:latest ./api-gateway
```

### Minikube

Start Minikube:

```bash
minikube start
kubectl config use-context minikube
```

Load locally built images into Minikube:

```bash
minikube image load auth-service:latest
minikube image load doctor-service:latest
minikube image load patient-service:latest
minikube image load appointment-service:latest
minikube image load payment-service:latest
minikube image load notification-service:latest
minikube image load telemedicine-service:latest
minikube image load ai-symptom-service:latest
minikube image load ai-doctor-suggestion-service:latest
minikube image load api-gateway:latest
```

Apply all manifests:

```bash
kubectl apply -f k8s/
```

Validate the deployment:

```bash
kubectl get pods
kubectl get services
kubectl get deployments
```

Expose the API gateway locally:

```bash
kubectl port-forward service/api-gateway 8088:8088
```

Run the frontend separately:

```bash
cd frontend
npm install
npm run dev
```

### Docker Desktop Kubernetes

Enable Kubernetes in Docker Desktop, then use the Docker Desktop Kubernetes context:

```bash
kubectl config use-context docker-desktop
```

Build the images with Docker as shown above. Docker Desktop Kubernetes can use images from the local Docker engine, so skip all `minikube image load` commands.

Apply and validate:

```bash
kubectl apply -f k8s/
kubectl get pods
kubectl get services
kubectl get deployments
kubectl port-forward service/api-gateway 8088:8088
```

Run the frontend separately:

```bash
cd frontend
npm install
npm run dev
```

### Docker Desktop Differences

- Skip `minikube image load`; it is only needed for Minikube.
- Use `kubectl config use-context docker-desktop`.
- Keep local backend image references as `<service-name>:latest`.
- Keep `imagePullPolicy: IfNotPresent` for local images.
- `ClusterIP` services plus `kubectl port-forward` are valid for both Minikube and Docker Desktop.
- No YAML changes are strictly required just because a teammate uses Docker Desktop Kubernetes instead of Minikube.

### Current Gateway Coverage

The API gateway runs on port `8088`. Current gateway routes cover appointment, doctor, prescription, payment, telemedicine, AI doctor suggestion, and AI symptom APIs. Auth, patient, and notification Kubernetes services exist, but they are not currently routed through the API gateway configuration.
