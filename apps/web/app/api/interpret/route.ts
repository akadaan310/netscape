import {NextRequest,NextResponse} from 'next/server';
import {createRateLimiter,interpretRequest} from '../../../lib/resource-service';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=15;
const allow=createRateLimiter();let active=0;
export async function GET(request:NextRequest){
 const params=request.nextUrl.searchParams;
 const publicRead=params.has('url');
 if(publicRead&&(!allow(Date.now())||active>=4))return NextResponse.json({error:'Public read budget reached. Try a local demo or wait one minute.'},{status:429,headers:{'Retry-After':'60','Cache-Control':'no-store'}});
 if(publicRead)active++;
 try{const result=await interpretRequest(params);return NextResponse.json(result.body,{status:result.status,headers:{'Cache-Control':'no-store'}});}
 finally{if(publicRead)active--;}
}
