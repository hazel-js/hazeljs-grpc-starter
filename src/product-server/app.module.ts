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
