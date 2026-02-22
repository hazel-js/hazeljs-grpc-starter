import { Service } from '@hazeljs/core';
import { GrpcClientService } from '@hazeljs/grpc';

@Service()
export class OrderService {
  constructor(private grpcClient: GrpcClientService) {}

  async getProduct(productId: string): Promise<{ id: string; name: string; price: number }> {
    const client = this.grpcClient.getClient('ProductService');
    return new Promise((resolve, reject) => {
      client.getProduct({ id: productId }, (err, res) => {
        if (err) reject(err);
        else resolve(res as { id: string; name: string; price: number });
      });
    });
  }

  async listProducts(limit = 10): Promise<{ products: Array<{ id: string; name: string; price: number }> }> {
    const client = this.grpcClient.getClient('ProductService');
    return new Promise((resolve, reject) => {
      client.ListProducts({ limit }, (err, res) => {
        if (err) reject(err);
        else resolve(res as { products: Array<{ id: string; name: string; price: number }> });
      });
    });
  }
}
