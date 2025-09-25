# 🏢 MultiTenantService

Este servicio abstracto provee una capa genérica para manejar **entidades multi-tenant** en aplicaciones con **NestJS + TypeORM**.  
Se encarga de aplicar automáticamente el `tenant_id` y soporta operaciones comunes como CRUD, paginación, búsquedas y soft delete.

---

## 🚀 Uso

### 1. Crear tu entidad
Tu entidad debe extender de `MultiTenantEntity` para heredar los campos comunes (`tenant_id`, `deleted_at`).

```ts
// src/modules/products/product.entity.ts
import { Entity, Column } from 'typeorm';
import { MultiTenantEntity } from 'src/core/multi-tenant.entity';

@Entity('products')
export class ProductEntity extends MultiTenantEntity {
  @Column()
  name: string;

  @Column('decimal')
  price: number;
}
```

---

### 2. Extender el servicio
Crea un servicio específico para tu entidad extendiendo `MultiTenantService`.

```ts
// src/modules/products/product.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MultiTenantService } from 'src/core/multitenant.service';
import { ProductEntity } from './product.entity';

@Injectable()
export class ProductService extends MultiTenantService<ProductEntity> {
  constructor(
    @InjectRepository(ProductEntity)
    repository: Repository<ProductEntity>,
  ) {
    super(repository);
  }

  // Ejemplo: validación extra
  protected async validate(tenantId: number, data: Partial<ProductEntity>) {
    if (!data.name) {
      throw new Error('El producto debe tener un nombre');
    }
  }
}
```

---

### 3. Usarlo en un controlador
Pasa siempre el `tenantId` al invocar los métodos.

```ts
// src/modules/products/product.controller.ts
import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get(':tenantId')
  async getAll(@Param('tenantId') tenantId: number) {
    return this.productService.findAll(tenantId);
  }

  @Post(':tenantId')
  async create(
    @Param('tenantId') tenantId: number,
    @Body() body: { name: string; price: number },
  ) {
    return this.productService.create(tenantId, body);
  }
}
```

---

## 📚 Métodos disponibles

### CRUD
- `findAll(tenantId, options?)` → Lista todas las entidades del tenant.
- `findById(tenantId, id)` → Busca por ID.
- `findByIdOrFail(tenantId, id)` → Igual que `findById`, pero lanza `NotFoundException`.
- `create(tenantId, data)` → Crea una nueva entidad.
- `update(tenantId, id, data)` → Actualiza la entidad (sin permitir cambiar `tenant_id`).
- `delete(tenantId, id)` → Soft delete.
- `hardDelete(tenantId, id)` → Elimina físicamente.

### Paginación
- `findByPage(tenantId, page?, pageSize?, where?, options?)`

### Búsquedas
- `findByName(tenantId, name)`
- `findByField(tenantId, field, value)`
- `searchByFields(tenantId, searchTerm, fields)`

### Estadísticas
- `count(tenantId, where?)`
- `exists(tenantId, where)`
- `getStats(tenantId)` → Retorna `{ total, active, deleted }`

### Batch
- `createMany(tenantId, data[])`
- `deleteMany(tenantId, ids[])`

---

## ✅ Ejemplo rápido

```ts
// Crear producto
await productService.create(1, { name: 'Laptop', price: 1500 });

// Listar productos
await productService.findAll(1);

// Paginación
await productService.findByPage(1, 1, 10);

// Buscar por nombre
await productService.findByName(1, 'laptop');

// Eliminar con soft delete
await productService.delete(1, 5);

// Estadísticas
await productService.getStats(1);
```

---

## 🛡️ Seguridad

- Cada query filtra automáticamente por `tenant_id` y `deleted_at = null`.
- No es posible actualizar el `tenant_id`.
- Se lanzan excepciones (`ForbiddenException`, `NotFoundException`) si se intenta acceder a datos de otro tenant.

---

## 📌 Notas

- `clearCache(tenantId)` → Método opcional a implementar en servicios concretos si necesitás limpiar cachés.
- `validate(tenantId, data)` → Método opcional para validaciones específicas del dominio.
