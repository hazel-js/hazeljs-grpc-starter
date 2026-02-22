import 'reflect-metadata';
import { HazelApp } from '@hazeljs/core';
import { OrderAppModule } from './app.module';

async function bootstrap() {
  const app = new HazelApp(OrderAppModule);

  await app.listen(3000);

  console.log('Order service (gRPC client) running on http://localhost:3000');
  console.log('  GET http://localhost:3000/products       - list products (via gRPC)');
  console.log('  GET http://localhost:3000/products/:id   - get product by id (via gRPC)');
  console.log('');
  console.log('Make sure Product gRPC server is running on localhost:50051');
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
