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
