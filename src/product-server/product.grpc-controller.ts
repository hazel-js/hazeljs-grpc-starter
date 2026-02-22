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
    if (!product) {
      throw new Error(`Product not found: ${data.id}`);
    }
    return product;
  }

  @GrpcMethod('ProductService', 'ListProducts')
  listProducts(data: { limit?: number }) {
    const limit = data.limit ?? 10;
    const products = PRODUCTS.slice(0, limit);
    return { products };
  }
}
