import type {NextConfig} from 'next';
import path from 'node:path';
const config:NextConfig={
  outputFileTracingRoot:path.resolve(process.cwd(),'../..'),
  transpilePackages:['@netscape/core','@netscape/chromatics','@netscape/dynamics','@netscape/performers','@netscape/resource-interpreter','@netscape/render-react','@netscape/conformance'],
  poweredByHeader:false,
  experimental:{cpus:2},
  async headers(){return [{source:'/:path*',headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'X-Frame-Options',value:'DENY'},
    {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
    {key:'Content-Security-Policy',value:"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"}
  ]}];}
};export default config;
