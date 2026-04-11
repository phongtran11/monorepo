# Category Module Sequence Diagrams

This document contains sequence diagrams for the endpoints of the Category module (`apps/api/src/category`).

## 1. Retrieve Categories Tree Structure (GET `/categories`)

```mermaid
sequenceDiagram
    actor Client
    participant Controller as CategoryController
    participant Service as CategoryService
    participant Repo as CategoryRepository

    Client->>Controller: GET /categories
    activate Controller
    Controller->>Service: findAllTree()
    activate Service
    Service->>Repo: findTrees()
    activate Repo
    Repo-->>Service: category trees (Category[])
    deactivate Repo

    Service->>Service: sortCategoriesRecursive()
    Service-->>Controller: sorted category trees
    deactivate Service

    Controller-->>Client: ApiResponseDto.success(CategoryResponseDto[])
    deactivate Controller
```

## 2. Create Category (POST `/categories`)

```mermaid
sequenceDiagram
    actor Client
    participant Controller as CategoryController
    participant Service as CategoryService
    participant Upload as TempUploadService
    participant Cloud as CloudinaryService
    participant Repo as CategoryRepository
    participant DB as DataSource (Transaction)

    Client->>Controller: POST /categories (CreateCategoryDto)
    activate Controller
    Controller->>Service: create(dto, userId)
    activate Service

    %% Validate Slug
    Service->>Repo: findOne({ where: { slug } })
    activate Repo
    Repo-->>Service: existing category or null
    deactivate Repo

    alt slug exists
        Service-->>Controller: ConflictException("Slug danh mục đã tồn tại")
    else slug unique
        %% Image Processing
        opt if dto.imageId provided
            Service->>Upload: consumeTempMeta(dto.imageId, userId)
            activate Upload
            Upload-->>Service: publicId
            deactivate Upload

            Service->>Cloud: moveToPermanent(publicId, "uploads/category/...")
            activate Cloud
            Cloud-->>Service: moved details (publicId, secureUrl)
            deactivate Cloud
        end

        %% Database Transaction
        Service->>DB: transaction(async manager => ...)
        activate DB
        DB->>Repo: create(category input)
        activate Repo
        Repo-->>DB: category entity
        deactivate Repo

        opt if dto.parentId provided
            DB->>Repo: findOne(parentId)
            activate Repo
            Repo-->>DB: parent category
            deactivate Repo
        end

        DB->>Repo: save(category)
        activate Repo
        Repo-->>DB: saved category
        deactivate Repo

        DB-->>Service: return saved category
        deactivate DB

        opt on Transaction Error & image was moved
            Service->>Cloud: deleteAsset(finalImagePublicId)
            activate Cloud
            Cloud-->>Service: void
            deactivate Cloud
        end

        Service-->>Controller: newly created category
        Controller-->>Client: ApiResponseDto.success(CategoryResponseDto)
    end
    deactivate Service
    deactivate Controller
```

## 3. Update Category (PATCH `/categories/:id`)

```mermaid
sequenceDiagram
    actor Client
    participant Controller as CategoryController
    participant Service as CategoryService
    participant Upload as TempUploadService
    participant Cloud as CloudinaryService
    participant Repo as CategoryRepository
    participant DB as DataSource (Transaction)

    Client->>Controller: PATCH /categories/:id (UpdateCategoryDto)
    activate Controller
    Controller->>Service: update(id, dto, userId)
    activate Service

    %% Image Processing First
    opt if dto.imageId provided
        Service->>Upload: consumeTempMeta(dto.imageId, userId)
        activate Upload
        Upload-->>Service: publicId
        deactivate Upload

        Service->>Cloud: moveToPermanent(publicId, "uploads/category/...")
        activate Cloud
        Cloud-->>Service: moved details (publicId, secureUrl)
        deactivate Cloud
    end

    %% Database Transaction
    Service->>DB: transaction(async manager => ...)
    activate DB
    DB->>Repo: findOne(id)
    activate Repo
    Repo-->>DB: category entity
    deactivate Repo

    opt if renaming category
        DB->>Repo: findOne({ where: { slug } })
        activate Repo
        Repo-->>DB: existing category or null
        deactivate Repo
    end

    opt if changing parent (dto.parentId)
        DB->>Repo: findOne(dto.parentId)
        activate Repo
        Repo-->>DB: parent category
        deactivate Repo

        DB->>Repo: findDescendants(category)
        activate Repo
        Repo-->>DB: category descendants
        deactivate Repo
        Note over DB: Verify parent is not a descendant to prevent cycles
    end

    DB->>Repo: save(updated category)
    activate Repo
    Repo-->>DB: saved category
    deactivate Repo

    DB-->>Service: result (saved category)
    deactivate DB

    %% Post Transaction Image Cleanup
    opt transaction success & old image existed
        Service->>Cloud: deleteAsset(oldImagePublicId)
        activate Cloud
        Cloud-->>Service: void
        deactivate Cloud
    end

    opt on Transaction Error & new image was moved
        Service->>Cloud: deleteAsset(newImagePublicId)
        activate Cloud
        Cloud-->>Service: void
        deactivate Cloud
    end

    Service-->>Controller: updated category
    Controller-->>Client: ApiResponseDto.success(CategoryResponseDto)
    deactivate Service
    deactivate Controller
```

## 4. Delete Category (DELETE `/categories/:id`)

```mermaid
sequenceDiagram
    actor Client
    participant Controller as CategoryController
    participant Service as CategoryService
    participant Repo as CategoryRepository

    Client->>Controller: DELETE /categories/:id
    activate Controller
    Controller->>Service: remove(id)
    activate Service

    Service->>Repo: findOne(id, { relations: ['children'] })
    activate Repo
    Repo-->>Service: category entity
    deactivate Repo

    alt category has children
        Service-->>Controller: ConflictException("Không thể xóa danh mục có chứa danh mục con")
    else no children
        Service->>Repo: softRemove(category)
        activate Repo
        Repo-->>Service: void
        deactivate Repo
        Service-->>Controller: void
    end

    Controller-->>Client: ApiResponseDto.success(null)
    deactivate Service
    deactivate Controller
```
