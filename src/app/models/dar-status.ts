export class ProductStatus {
  expectedSize: string;
  percentageCompleted: string;
  productStatus: string;
  productURL: string;
  localPath: string;
};

export class DarStatus {
  ID: string;
  dlManagerId: string;
  message: string;
  productStatuses: ProductStatus[];
  status: number;
  type: string;
  downloadDirectory: string;
};
