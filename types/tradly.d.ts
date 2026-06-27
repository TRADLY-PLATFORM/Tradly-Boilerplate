// Tradly JS SDK has no published TypeScript types.
// All SDK calls in api/*.ts cast with (TradlySDK as any) so this is a minimal ambient declaration.
declare module 'tradly' {
  const TradlySDK: any
  export default TradlySDK
}
