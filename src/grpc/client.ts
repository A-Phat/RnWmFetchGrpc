import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web'
import { ProductService } from './protos/product_connect';
import type { DescService } from '@bufbuild/protobuf';
import type {
  CreateProductRequest,
  CreateProductResponse,
  GetProductRequest,
  GetProductResponse,
  GetAllProductsRequest,
  GetAllProductsResponse,
} from './protos/product_pb';
// (no direct MessageInitShape use — requests are typed as Partial<...> below)

const transport = createConnectTransport({
  baseUrl: 'http://10.0.2.2:5000', // 👈 URL ของ gRPC Gateway / Connect
})

// ProductService descriptor shape doesn't match the exact DescService shape the
// `createClient` typings expect. Cast at the return to a narrowly typed client
// so callers get proper method signatures instead of `never`.
type ProductClient = {
  // Accept plain object (partial) request shapes so callers can pass simple POJOs
  createProduct: (req: Partial<CreateProductRequest>, options?: any) => Promise<CreateProductResponse>;
  getProduct: (req: Partial<GetProductRequest>, options?: any) => Promise<GetProductResponse>;
  getAllProducts: (req: Partial<GetAllProductsRequest>, options?: any) => Promise<GetAllProductsResponse>;
};
const productClient = createClient(ProductService as unknown as DescService, transport) as unknown as ProductClient;
console.log("productClient ======= ", productClient);

export default productClient;
