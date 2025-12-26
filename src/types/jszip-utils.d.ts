declare module "jszip-utils" {
  export function getBinaryContent(
    path: string,
    callback: (err: Error | null, data: any) => void
  ): void
}
