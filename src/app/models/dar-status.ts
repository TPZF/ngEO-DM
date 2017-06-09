export class ProductStatus {
  expectedSize: string;
  percentageCompleted: string;
  productURL: string;
  productStatus?: string;
  localPath?: string;
  errorMsg?: string;
  loadedSize?: string;
  mode?: string;
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
