# HazelJS gRPC Starter

A complete example demonstrating **gRPC server** and **gRPC client** with [HazelJS](https://hazeljs.com) using [@hazeljs/grpc](https://www.npmjs.com/package/@hazeljs/grpc).

## Architecture

```
┌─────────────────────────┐         gRPC          ┌─────────────────────────┐
│  Order Service (Client)  │ ──────────────────────▶│  Product Service (Server)│
│  HTTP :3000              │   localhost:50051      │  gRPC :50051             │
│  GrpcClientModule        │                        │  GrpcModule             │
└─────────────────────────┘                        └─────────────────────────┘
```

- **Product Server**: gRPC server exposing `ProductService` (GetProduct, ListProducts)
- **Order Client**: HTTP API that calls Product Service via gRPC

## Prerequisites

- Node.js >= 18
- npm or pnpm

## Installation

```bash
cd hazeljs-grpc-starter
npm install
```

## Running the Example

### 1. Start the Product gRPC Server

```bash
npm run dev:product-server
```

This starts:
- gRPC server on `0.0.0.0:50051`
- HTTP server on `http://localhost:3001` (for health checks)

### 2. Start the Order Client Service

In a **second terminal**:

```bash
npm run dev:order-client
```

This starts the Order service on `http://localhost:3000` with HTTP endpoints that call the Product gRPC service.

### 3. Test the Flow

```bash
# List products (Order → gRPC → Product)
curl http://localhost:3000/products

# Get product by ID
curl http://localhost:3000/products/1
```

## Project Structure

```
hazeljs-grpc-starter/
├── proto/
│   └── product.proto          # Shared proto definition
├── src/
│   ├── product-server/         # gRPC Server
│   │   ├── product.grpc-controller.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── order-client/          # gRPC Client
│       ├── order.service.ts   # Uses GrpcClientService
│       ├── order.controller.ts
│       ├── app.module.ts
│       └── main.ts
├── package.json
└── README.md
```

## Key Concepts

### Product Server (gRPC)

- Uses `GrpcModule.forRoot()` with proto path and package
- `@GrpcMethod('ProductService', 'GetProduct')` decorates RPC handlers
- `GrpcModule.registerHandlersFromProviders()` wires controllers

### Order Client (gRPC)

- Uses `GrpcClientModule.forRoot()` with proto path and `defaultUrl`
- Injects `GrpcClientService` and calls `getClient('ProductService')`
- Stub methods like `GetProduct`, `ListProducts` use callback style

## Build

```bash
npm run build
npm run start:product-server   # Terminal 1
npm run start:order-client     # Terminal 2
```

## Links

- [@hazeljs/grpc on npm](https://www.npmjs.com/package/@hazeljs/grpc)
- [HazelJS gRPC Documentation](https://hazeljs.com/docs/packages/grpc)
- [HazelJS](https://hazeljs.com)
