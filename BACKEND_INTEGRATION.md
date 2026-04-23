# FinSecure Frontend - Backend Integration Guide

## Frontend Configuration ✅

**Framework:** React + Vite  
**Port:** 5174 (dev server)  
**Backend Base URL:** `http://localhost:8085/finsecure`

## Backend Configuration ✅

**Project:** FinSecureProject (Spring Boot)  
**Port:** 8085  
**Database:** MySQL (localhost:3306, database: `finsecure_insurance`)

## Required Backend Endpoints

Your Spring Boot backend must implement these endpoints:

### Authentication
- `POST /finsecure/public/login`
  - Request: `{ username, password }`
  - Response: `{ token: "JWT_TOKEN" }`
  - JWT must include `role` claim (e.g., "ADMIN", "EMPLOYEE", "HR", "FINANCE")

### Insurance Plans
- `GET /finsecure/insurance/plans` — All plans (ADMIN/HR)
- `POST /finsecure/insurance/plans` — Create plan (ADMIN)
- `POST /finsecure/insurance/plans/assign` — Assign to employee (ADMIN)
- `GET /finsecure/insurance/plans/my` — Employee's insurance

### Claims
- `GET /finsecure/insurance/claims/my` — Employee's claims
- `POST /finsecure/insurance/claims` — Raise claim
- `GET /finsecure/insurance/claims` — All claims (ADMIN/HR, optional `?status=PENDING`)
- `PUT /finsecure/insurance/claims/status` — Approve/reject (ADMIN)

### Top-ups
- `GET /finsecure/insurance/topups/plans` — Available top-up plans
- `POST /finsecure/insurance/topups/buy` — Buy top-up
- `GET /finsecure/insurance/topups/my` — Employee's top-ups

### Summary
- `GET /finsecure/insurance/summary/my` — Employee's insurance summary

## CORS Configuration

Add CORS configuration to your Spring Boot `application.yml`:

```yaml
spring:
  web:
    cors:
      allowed-origins: "http://localhost:5174"
      allowed-methods: GET,POST,PUT,DELETE,OPTIONS
      allowed-headers: Content-Type,Authorization
      allow-credentials: true
      max-age: 3600
```

Or configure via Java Config:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/finsecure/**")
            .allowedOrigins("http://localhost:5174")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("Content-Type", "Authorization")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

## Frontend Login Flow

1. User submits username/password
2. Frontend calls `POST /finsecure/public/login`
3. Backend returns JWT token
4. Frontend extracts `role` from JWT payload
5. Stores `jwt_token` and `jwt_role` in localStorage
6. All subsequent API calls include `Authorization: Bearer <token>` header

## Testing the Connection

Use Swagger UI to test endpoints:
```
http://localhost:8085/swagger-ui.html
```

Or test login via curl:
```bash
curl -X POST http://localhost:8085/finsecure/public/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

## Development Environment Variables

File: `.env` (already configured)

```
VITE_API_BASE_URL=http://localhost:8085/finsecure
VITE_APP_NAME=FinSecure Insurance Portal
```

## Next Steps

1. ✅ Verify your Spring Boot backend is running on port 8085
2. ✅ Implement the required endpoints listed above
3. ✅ Add CORS configuration to your backend
4. ✅ Test login endpoint with valid credentials
5. ✅ Run `npm run dev` and access http://localhost:5174/login

## Troubleshooting

**CORS Error:**
- Add CORS config to backend application.yml
- Restart backend service

**JWT Parse Error:**
- Verify JWT token includes `role` claim
- Check token format: `header.payload.signature`

**401 Unauthorized:**
- Token not sent with request (check Authorization header)
- Token expired or invalid
- Backend not validating JWT properly

**404 Endpoint Not Found:**
- Verify endpoint path matches exactly
- Check `@RequestMapping` decorators in Spring controllers
- Ensure controller methods are returning correct response format
