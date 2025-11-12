import { NativeModules } from 'react-native';

interface GrpcModuleInterface {
    initialize(host: string, port: number): Promise<boolean>;
    createProduct(
        skuid: string,
        barcodePos: string,
        productName: string,
        merchantId: string
    ): Promise<{ message: string; id?: string }>;
    shutdown(): Promise<boolean>;
}

const { GrpcModule } = NativeModules as { GrpcModule: GrpcModuleInterface };

class NativeGrpcClient {
    private initialized = false;

    async initialize(host: string = '10.0.2.2', port: number = 5000) {
        if (!this.initialized) {
            await GrpcModule.initialize(host, port);
            this.initialized = true;
            console.log('[NativeGrpc] ✅ Initialized');
        }
    }

    async createProduct(params: {
        skuid: string;
        barcodePos: string;
        productName: string;
        merchantId: string;
    }) {
        if (!this.initialized) {
            await this.initialize();
        }

        const result = await GrpcModule.createProduct(
            params.skuid,
            params.barcodePos,
            params.productName,
            params.merchantId
        );

        return result;
    }

    async shutdown() {
        if (this.initialized) {
            await GrpcModule.shutdown();
            this.initialized = false;
        }
    }
}

export default new NativeGrpcClient();
