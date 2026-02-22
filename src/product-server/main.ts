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
