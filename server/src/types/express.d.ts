declare module "express" {
  namespace Express {
    interface Request {
      [key: string]: any;
    }

    interface Response {
      [key: string]: any;
    }
  }

  export function Router(options?: any): any;
  export interface Request {
    body: any;
    params: any;
    query: any;
    app: any;
    [key: string]: any;
  }

  export interface Response {
    status(code: number): Response;
    json(body: any): Response;
    send(body: any): Response;
    setHeader(name: string, value: string): Response;
    write(chunk: any): boolean;
    end(chunk?: any): Response;
    [key: string]: any;
  }

  interface ExpressApplication {
    Router(options?: any): any;
    [key: string]: any;
  }

  const express: ExpressApplication;
  export { express };
}
