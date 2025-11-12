import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web'
import { ProductService } from './protos/product_pb';

const transport = createConnectTransport({
  baseUrl: 'http://10.0.2.2:5000', // 👈 URL ของ gRPC Gateway / Connect
})

export const productClient = createClient(ProductService, transport)
