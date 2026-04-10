# Authentication Sequence Diagrams

This document contains the sequence diagrams for the endpoints provided by the `apps/api/src/auth` module.

## 1. Register (POST `/auth/register`)

```mermaid
sequenceDiagram
    actor Client
    participant Controller as AuthController
    participant Auth as AuthService
    participant UserSvc as UserService
    participant Jwt as JwtService
    participant SessionRepo as SessionRepository

    Client->>Controller: POST /auth/register (RegisterDto)
    activate Controller
    Controller->>Auth: register(dto, ip, userAgent)
    activate Auth
    Auth->>UserSvc: findByEmailWithDeleted(dto.email)
    activate UserSvc
    UserSvc-->>Auth: user (or null)
    deactivate UserSvc
    
    alt user exists
        Auth-->>Controller: throw ConflictException('Email đã tồn tại')
        Controller-->>Client: 409 Conflict
    else user does not exist
        Auth->>Auth: Hash password (argon2)
        Auth->>UserSvc: create(email, hashedPassword)
        activate UserSvc
        UserSvc-->>Auth: newly created User
        deactivate UserSvc
        
        Note over Auth,SessionRepo: Calling generateTokens(user, ip, userAgent)
        Auth->>Jwt: sign(accessTokenPayload)
        activate Jwt
        Jwt-->>Auth: accessToken
        deactivate Jwt
        
        Auth->>Jwt: sign(refreshTokenPayload with jti)
        activate Jwt
        Jwt-->>Auth: refreshToken
        deactivate Jwt
        
        Auth->>Auth: Hash refreshToken (argon2)
        Auth->>SessionRepo: create & save session (jti, hashedToken, expiresAt)
        activate SessionRepo
        SessionRepo-->>Auth: session saved
        deactivate SessionRepo
        
        Auth-->>Controller: TokenDto (tokens & expirations)
        Controller-->>Client: 201 Created + TokenDto
    end
    deactivate Auth
    deactivate Controller
```

## 2. Login (POST `/auth/login`)

```mermaid
sequenceDiagram
    actor Client
    participant Controller as AuthController
    participant Auth as AuthService
    participant UserSvc as UserService
    participant Jwt as JwtService
    participant SessionRepo as SessionRepository

    Client->>Controller: POST /auth/login (LoginDto)
    activate Controller
    Controller->>Auth: login(dto, ip, userAgent)
    activate Auth
    Auth->>UserSvc: findByEmail(dto.email)
    activate UserSvc
    UserSvc-->>Auth: user (or null)
    deactivate UserSvc
    
    alt user not found
        Auth-->>Controller: throw UnauthorizedException('Tài khoản không tồn tại')
        Controller-->>Client: 401 Unauthorized
    else user banned
        Auth-->>Controller: throw UnauthorizedException('Tài khoản của bạn đã bị khoá')
        Controller-->>Client: 401 Unauthorized
    else valid user
        Auth->>Auth: Verify password (argon2)
        
        alt password invalid
            Auth-->>Controller: throw UnauthorizedException('Email hoặc mật khẩu không chính xác')
            Controller-->>Client: 401 Unauthorized
        else password valid
            Note over Auth,SessionRepo: Calling generateTokens(...)
            Auth->>Jwt: sign(accessTokenPayload)
            activate Jwt
            Jwt-->>Auth: accessToken
            deactivate Jwt
            
            Auth->>Jwt: sign(refreshTokenPayload with jti)
            activate Jwt
            Jwt-->>Auth: refreshToken
            deactivate Jwt
            
            Auth->>Auth: Hash refreshToken (argon2)
            Auth->>SessionRepo: create & save session
            activate SessionRepo
            SessionRepo-->>Auth: session saved
            deactivate SessionRepo
            
            Auth-->>Controller: TokenDto
            Controller-->>Client: 200 OK + LoginResponseDto (Tokens + User info)
        end
    end
    deactivate Auth
    deactivate Controller
```

## 3. Get Profile (GET `/auth/profile`)

```mermaid
sequenceDiagram
    actor Client
    participant Controller as AuthController

    Client->>Controller: GET /auth/profile (Bearer AccessToken)
    activate Controller
    Note over Controller: Authenticated via JwtAuthGuard
    Controller-->>Client: 200 OK + ProfileDto (User info + RolePermissionsMap)
    deactivate Controller
```

## 4. Refresh Token (POST `/auth/refresh`)

```mermaid
sequenceDiagram
    actor Client
    participant Controller as AuthController
    participant Auth as AuthService
    participant UserSvc as UserService
    participant Jwt as JwtService
    participant SessionRepo as SessionRepository

    Client->>Controller: POST /auth/refresh (Bearer RefreshToken)
    activate Controller
    Note over Controller: Authenticated via JwtRefreshAuthGuard
    Controller->>Auth: refreshToken(userId, jti, rawToken, ip, userAgent)
    activate Auth
    
    Auth->>SessionRepo: findOne(where: { id: jti, userId })
    activate SessionRepo
    SessionRepo-->>Auth: session (or null)
    deactivate SessionRepo
    
    alt no session or expired
        Auth->>SessionRepo: remove session (if exists)
        activate SessionRepo
        SessionRepo-->>Auth: void
        deactivate SessionRepo
        
        Auth-->>Controller: throw UnauthorizedException('Phiên đăng nhập đã hết hạn...')
        Controller-->>Client: 401 Unauthorized
    else valid session
        Auth->>UserSvc: findById(userId)
        activate UserSvc
        UserSvc-->>Auth: user (or null)
        deactivate UserSvc
        
        alt user not found or banned
            Auth->>SessionRepo: remove session
            activate SessionRepo
            SessionRepo-->>Auth: void
            deactivate SessionRepo
            
            Auth-->>Controller: throw UnauthorizedException('Tài khoản không tồn tại...')
            Controller-->>Client: 401 Unauthorized
        else valid user
            Auth->>Auth: Verify rawToken against session.refreshToken (argon2)
            
            alt invalid token hash
                Auth-->>Controller: throw UnauthorizedException('Token không hợp lệ')
                Controller-->>Client: 401 Unauthorized
            else valid token hash
                Auth->>SessionRepo: remove old session
                activate SessionRepo
                SessionRepo-->>Auth: void
                deactivate SessionRepo
                
                Note over Auth,SessionRepo: Calling generateTokens(user, ip, userAgent)
                Auth->>Jwt: sign new tokens
                activate Jwt
                Jwt-->>Auth: new tokens
                deactivate Jwt
                
                Auth->>SessionRepo: create & save new session
                activate SessionRepo
                SessionRepo-->>Auth: new session saved
                deactivate SessionRepo
                
                Auth-->>Controller: new TokenDto
                Controller-->>Client: 200 OK + TokenDto
            end
        end
    end
    deactivate Auth
    deactivate Controller
```

## 5. Logout (POST `/auth/logout`)

```mermaid
sequenceDiagram
    actor Client
    participant Controller as AuthController
    participant Auth as AuthService
    participant SessionRepo as SessionRepository

    Client->>Controller: POST /auth/logout (Bearer RefreshToken)
    activate Controller
    Note over Controller: Authenticated via JwtRefreshAuthGuard
    Controller->>Auth: logout(userId, jti)
    activate Auth
    
    Auth->>SessionRepo: findOne(where: { id: jti, userId })
    activate SessionRepo
    SessionRepo-->>Auth: session
    deactivate SessionRepo
    
    Auth->>SessionRepo: remove(session)
    activate SessionRepo
    SessionRepo-->>Auth: void
    deactivate SessionRepo
    
    Auth-->>Controller: void
    deactivate Auth
    Controller-->>Client: 200 OK
    deactivate Controller
```
