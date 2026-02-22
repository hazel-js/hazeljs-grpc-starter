import { Controller, Get, Param, Query } from '@hazeljs/core';
import { OrderService } from './order.service';

@Controller('')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get('/products')
  async listProducts(@Query('limit') limit?: string) {
    const products = await this.orderService.listProducts(limit ? parseInt(limit, 10) : 10);
    return products;
  }

  @Get('/products/:id')
  async getProduct(@Param('id') id: string) {
    const product = await this.orderService.getProduct(id);
    return product;
  }
}
