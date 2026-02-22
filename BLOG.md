# Building Microservices with HazelJS and gRPC: A Complete Starter Guide

A comprehensive guide to building a **gRPC server** and **gRPC client** using [HazelJS](https://hazeljs.com) and [@hazeljs/grpc](https://www.npmjs.com/package/@hazeljs/grpc). This starter demonstrates a real-world microservice architecture where an HTTP API (Order service) consumes a gRPC backend (Product service).

---

## Table of Contents

- [Why gRPC with HazelJS?](#why-grpc-with-hazeljs)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [The Proto Definition](#the-proto-definition)
- [Product Service (gRPC Server)](#product-service-grpc-server)
- [Order Service (gRPC Client)](#order-service-grpc-client)
- [Running the Example](#running-the-example)
- [Testing the Flow](#testing-the-flow)
- [Key Concepts & Patterns](#key-concepts--patterns)
- [Further Reading & Resources](#further-reading--resources)

---

## Why gRPC with HazelJS?

**[gRPC](https://grpc.io/)** is a high-performance RPC framework that uses [Protocol Buffers](https://protobuf.dev/) for serialization. It excels in service-to-service communication, offering:

- **Strong typing** via `.proto` schema definitions
- **Efficient binary serialization** (smaller payloads than JSON)
- **Streaming support** (unary, server, client, bidirectional)
- **Language-agnostic** contracts shared across polyglot systems

**[HazelJS](https://hazeljs.com)** is a TypeScript-first Node.js framework with dependency injection, decorators, and modular architecture. The [@hazeljs/grpc](https://www.npmjs.com/package/@hazeljs/grpc) package integrates gRPC seamlessly:

- **Decorator-based API** – `@GrpcMethod()` for declarative RPC handlers
- **DI integration** – Controllers and services resolved from the [HazelJS container](https://hazeljs.com/docs/packages/core)
- **Unified module system** – `GrpcModule` and `GrpcClientModule` plug into [HazelModule](https://hazeljs.com/docs/packages/core)
- **Built on [@grpc/grpc-js](https://www.npmjs.com/package/@grpc/grpc-js)** – Production-ready Node.js gRPC implementation

This starter shows how to combine both: a gRPC server for internal APIs and an HTTP gateway for external clients.

---

## Architecture Overview

```
┌─────────────────────────────────────┐         gRPC (localhost:50051)         ┌─────────────────────────────────────┐
│  Order Service (HTTP Gateway)       │ ──────────────────────────────────────▶│  Product Service (gRPC Backend)     │
│                                     │                                        │                                     │
│  • HTTP :3000                       │   GetProduct, ListProducts             │  • gRPC :50051                      │
│  • GrpcClientModule                 │                                        │  • GrpcModule                       │
│  • OrderController → OrderService   │                                        │  • ProductGrpcController            │
│    → GrpcClientService              │                                        │  • In-memory product catalog        │
└─────────────────────────────────────┘                                        └─────────────────────────────────────┘
         │                                                                                    │
         │ curl http://localhost:3000/products                                                │
         │ curl http://localhost:3000/products/1                                              │
         ▼                                                                                    │
    External clients                                                                   Internal service-to-service
```

**Flow:**

1. **External clients** call the Order service over HTTP (REST-style).
2. **OrderController** receives requests and delegates to **OrderService**.
3. **OrderService** injects **GrpcClientService** and calls the Product gRPC service.
4. **Product service** handles gRPC requests and returns product data.

This pattern is common in microservices: an HTTP API layer for external consumers, with internal services communicating via gRPC for performance and type safety.

---

## Prerequisites

- **Node.js** >= 18
- **npm** or **pnpm**
- Basic familiarity with [TypeScript](https://www.typescriptlang.org/), [gRPC](https://grpc.io/docs/), and [Protocol Buffers](https://protobuf.dev/)

---

## Project Structure

```
hazeljs-grpc-starter/
├── proto/
│   └── product.proto              # Shared service contract (ProductService)
├── src/
│   ├── product-server/           # gRPC Server
│   │   ├── main.ts               # Bootstrap: HazelApp + GrpcModule + GrpcServer
│   │   ├── app.module.ts         # ProductAppModule with GrpcModule.forRoot()
│   │   └── product.grpc-controller.ts  # @GrpcMethod handlers
│   └── order-client/             # gRPC Client (HTTP API)
│       ├── main.ts               # Bootstrap: HazelApp
│       ├── app.module.ts         # OrderAppModule with GrpcClientModule.forRoot()
│       ├── order.controller.ts  # HTTP routes → OrderService
│       └── order.service.ts     # GrpcClientService → Product gRPC
├── package.json
├── tsconfig.json
├── README.md
└── BLOG.md
```

---

## The Proto Definition

The contract is defined in `proto/product.proto`:

```proto
syntax = "proto3";
package catalog;

service ProductService {
  rpc GetProduct (GetProductRequest) returns (Product);
  rpc ListProducts (ListProductsRequest) returns (ListProductsResponse);
}

message GetProductRequest {
  string id = 1;
}

message ListProductsRequest {
  int32 limit = 1;
}

message Product {
  string id = 1;
  string name = 2;
  double price = 3;
}

message ListProductsResponse {
  repeated Product products = 1;
}
```

- **Package**: `catalog` – used by both server and client when loading the proto.
- **Service**: `ProductService` – two unary RPCs: `GetProduct` and `ListProducts`.
- **Messages**: Request/response types with field numbers for [Protocol Buffer encoding](https://protobuf.dev/programming-guides/encoding/).

Both services load this file; the server implements it, the client generates stubs from it. See [Protocol Buffers documentation](https://protobuf.dev/) for schema design best practices.

---

## Product Service (gRPC Server)

### Module Configuration

`src/product-server/app.module.ts`:

```typescript
import { HazelModule } from '@hazeljs/core';
import { GrpcModule } from '@hazeljs/grpc';
import { join } from 'path';
import { ProductGrpcController } from './product.grpc-controller';

@HazelModule({
  imports: [
    GrpcModule.forRoot({
      protoPath: join(__dirname, '../../proto/product.proto'),
      package: 'catalog',
      url: '0.0.0.0:50051',
    }),
  ],
  providers: [ProductGrpcController],
})
export class ProductAppModule {}
```

- **GrpcModule.forRoot()** – Configures the gRPC server with proto path, package name, and bind address.
- **providers** – Registers `ProductGrpcController` in the [HazelJS DI container](https://hazeljs.com/docs/packages/core).

### gRPC Controller

`src/product-server/product.grpc-controller.ts`:

```typescript
import { Controller } from '@hazeljs/core';
import { GrpcMethod } from '@hazeljs/grpc';

const PRODUCTS: Array<{ id: string; name: string; price: number }> = [
  { id: '1', name: 'Widget', price: 9.99 },
  { id: '2', name: 'Gadget', price: 19.99 },
  { id: '3', name: 'Gizmo', price: 4.99 },
];

@Controller('')
export class ProductGrpcController {
  @GrpcMethod('ProductService', 'GetProduct')
  getProduct(data: { id: string }) {
    const product = PRODUCTS.find((p) => p.id === data.id);
    if (!product) throw new Error(`Product not found: ${data.id}`);
    return product;
  }

  @GrpcMethod('ProductService', 'ListProducts')
  listProducts(data: { limit?: number }) {
    const limit = data.limit ?? 10;
    return { products: PRODUCTS.slice(0, limit) };
  }
}
```

- **@GrpcMethod(serviceName, methodName)** – Maps a class method to an RPC. See [@hazeljs/grpc API](https://hazeljs.com/docs/packages/grpc).
- Handlers receive plain objects matching the proto request; return values match the response type.

### Bootstrap

`src/product-server/main.ts`:

```typescript
import 'reflect-metadata';
import { HazelApp } from '@hazeljs/core';
import { GrpcModule, GrpcServer } from '@hazeljs/grpc';
import { Container } from '@hazeljs/core';
import { ProductAppModule } from './app.module';
import { ProductGrpcController } from './product.grpc-controller';

async function bootstrap() {
  const app = new HazelApp(ProductAppModule);

  GrpcModule.registerHandlersFromProviders([ProductGrpcController]);

  await app.listen(3001);

  const grpcServer = Container.getInstance().resolve(GrpcServer);
  await grpcServer.start();

  console.log('Product gRPC server listening on 0.0.0.0:50051');
  console.log('HTTP server (health) on http://localhost:3001');
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- **registerHandlersFromProviders()** – Registers `@GrpcMethod` handlers from controller classes.
- **app.listen(3001)** – Starts the HTTP server (e.g. for health checks).
- **grpcServer.start()** – Binds the gRPC server to the configured port.

---

## Order Service (gRPC Client)

### Module Configuration

`src/order-client/app.module.ts`:

```typescript
import { HazelModule } from '@hazeljs/core';
import { GrpcClientModule } from '@hazeljs/grpc';
import { join } from 'path';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

@HazelModule({
  imports: [
    GrpcClientModule.forRoot({
      protoPath: join(__dirname, '../../proto/product.proto'),
      package: 'catalog',
      defaultUrl: 'localhost:50051',
    }),
  ],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderAppModule {}
```

- **GrpcClientModule.forRoot()** – Configures the gRPC client with the same proto and `defaultUrl` for the Product service.
- **providers** – `OrderService` (uses `GrpcClientService`).
- **controllers** – `OrderController` (HTTP routes).

### Order Service (gRPC Client Usage)

`src/order-client/order.service.ts`:

```typescript
import { Service } from '@hazeljs/core';
import { GrpcClientService } from '@hazeljs/grpc';

@Service()
export class OrderService {
  constructor(private grpcClient: GrpcClientService) {}

  async getProduct(productId: string) {
    const client = this.grpcClient.getClient('ProductService');
    return new Promise((resolve, reject) => {
      client.GetProduct({ id: productId }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  async listProducts(limit = 10) {
    const client = this.grpcClient.getClient('ProductService');
    return new Promise((resolve, reject) => {
      client.ListProducts({ limit }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }
}
```

- **GrpcClientService** – Injected by the container; provides `getClient(serviceName)`.
- **getClient('ProductService')** – Returns a stub with `GetProduct`, `ListProducts`, etc.
- Stub methods use the [Node.js gRPC callback style](https://grpc.io/docs/languages/node/basics/); we wrap them in `Promise` for async/await.

### Order Controller (HTTP API)

`src/order-client/order.controller.ts`:

```typescript
import { Controller, Get, Param, Query } from '@hazeljs/core';
import { OrderService } from './order.service';

@Controller('')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get('/products')
  async listProducts(@Query('limit') limit?: string) {
    const products = await this.orderService.listProducts(
      limit ? parseInt(limit, 10) : 10
    );
    return products;
  }

  @Get('/products/:id')
  async getProduct(@Param('id') id: string) {
    return await this.orderService.getProduct(id);
  }
}
```

- **@Controller('')** – Base path (empty = root).
- **@Get()** – HTTP GET routes; `@Query` and `@Param` for parameters.
- **Constructor injection** – `OrderService` is injected by [HazelJS core](https://hazeljs.com/docs/packages/core); no `@Injectable()` needed on controllers.

---

## Running the Example

### 1. Install dependencies

```bash
cd hazeljs-grpc-starter
npm install
```

### 2. Start the Product gRPC server

```bash
npm run dev:product-server
```

This starts:

- gRPC server on `0.0.0.0:50051`
- HTTP server on `http://localhost:3001` (health checks)

### 3. Start the Order client service

In a second terminal:

```bash
npm run dev:order-client
```

This starts the Order service on `http://localhost:3000`.

### 4. Production build (optional)

```bash
npm run build
npm run start:product-server   # Terminal 1
npm run start:order-client    # Terminal 2
```

---

## Testing the Flow

```bash
# List products (Order → gRPC → Product)
curl http://localhost:3000/products

# With limit
curl "http://localhost:3000/products?limit=2"

# Get product by ID
curl http://localhost:3000/products/1
```

**Expected responses:**

```json
// GET /products
{"products":[{"id":"1","name":"Widget","price":9.99},{"id":"2","name":"Gadget","price":19.99},{"id":"3","name":"Gizmo","price":4.99}]}

// GET /products/1
{"id":"1","name":"Widget","price":9.99}
```

---

## Key Concepts & Patterns

| Concept | Description |
|--------|-------------|
| **Proto as contract** | Both server and client load the same `.proto`; the schema is the shared contract. |
| **GrpcModule vs GrpcClientModule** | Server uses `GrpcModule`; client uses `GrpcClientModule`. |
| **@GrpcMethod** | Decorator that maps a class method to an RPC. See [@hazeljs/grpc README](https://github.com/hazel-js/hazeljs/tree/main/packages/grpc). |
| **GrpcClientService.getClient()** | Returns a cached stub for a service; use `defaultUrl` or pass `url` per call. |
| **registerHandlersFromProviders()** | Must be called before `grpcServer.start()` to wire `@GrpcMethod` handlers. |
| **Dependency injection** | Controllers and services are resolved from the HazelJS container; constructor injection works without `@Injectable()` on controllers. |

---

## Further Reading & Resources

### HazelJS

- [HazelJS](https://hazeljs.com) – Official site
- [@hazeljs/core](https://www.npmjs.com/package/@hazeljs/core) – Core framework (DI, routing, decorators)
- [@hazeljs/grpc](https://www.npmjs.com/package/@hazeljs/grpc) – gRPC module on npm
- [HazelJS gRPC Documentation](https://hazeljs.com/docs/packages/grpc) – Package docs

### gRPC & Protocol Buffers

- [gRPC](https://grpc.io/) – Official gRPC site
- [gRPC Node.js Quick Start](https://grpc.io/docs/languages/node/quickstart/)
- [Protocol Buffers](https://protobuf.dev/) – Schema and encoding
- [@grpc/grpc-js](https://www.npmjs.com/package/@grpc/grpc-js) – Node.js gRPC library
- [@grpc/proto-loader](https://www.npmjs.com/package/@grpc/proto-loader) – Runtime proto loading

### Related

- [hazeljs-grpc-starter](https://github.com/hazel-js/hazeljs-grpc-starter) – This starter (if published)
- [HazelJS GitHub](https://github.com/hazel-js/hazeljs) – Monorepo

---

*This blog post accompanies the HazelJS gRPC starter. For questions or contributions, see the [HazelJS repository](https://github.com/hazel-js/hazeljs).*
