export class ProductStatus {
    expectedSize: string;
    percentageCompleted: string;
    productStatus: string;
    productURL: string;
};

export class DarStatus {
    ID: string;
    dlManagerId: string;
    message: string;
    productStatuses: ProductStatus[];
    status: number;
    type: string;
};
