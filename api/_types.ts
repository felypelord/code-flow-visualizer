export type ApiRequest = {
  method?: string;
  headers: Record<string, unknown>;
  body?: any;
  query?: Record<string, unknown>;
};

export type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: any) => any;
};
