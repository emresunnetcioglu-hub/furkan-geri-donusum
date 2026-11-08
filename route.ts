import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
// Feed contract: [{"product_id":123,"proposed_price":125.5,"observed_at":"2026-11-08T12:00:00Z","source":"Provider name","source_url":"https://..."}]
// Only use a provider you have permission to consume; never auto-publish prices.
export async function GET(req:NextRequest){
 const secret=process.env.PRICE_SYNC_SECRET;
 if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});
 const url=process.env.PRICE_FEED_URL;
 if(!url||!url.startsWith('https://')||!process.env.SUPABASE_SERVICE_ROLE_KEY||!process.env.NEXT_PUBLIC_SUPABASE_URL)return NextResponse.json({error:'Price feed / database not configured'},{status:503});
 try{
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Feed HTTP '+response.status);
  const payload:unknown=await response.json();
  if(!Array.isArray(payload)||payload.length>500)throw new Error('Invalid feed');
  const rows=payload.map((x:unknown)=>{
   if(!x||typeof x!=='object')throw new Error('Invalid item');
   const r=x as Record<string,unknown>;
   if(!Number.isSafeInteger(r.product_id)||typeof r.proposed_price!=='number'||!Number.isFinite(r.proposed_price)||r.proposed_price<0||r.proposed_price>10000000||typeof r.source!=='string'||!r.source.trim())throw new Error('Invalid price item');
   return {product_id:r.product_id,proposed_price:r.proposed_price,source:r.source.slice(0,200),source_url:typeof r.source_url==='string'?r.source_url.slice(0,500):null,observed_at:typeof r.observed_at==='string'&&!isNaN(Date.parse(r.observed_at))?r.observed_at:new Date().toISOString(),status:'pending'};
  });
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
  if(!rows.length)return NextResponse.json({queued:0});
  const {error}=await db.from('price_suggestions').insert(rows);
  if(error)throw error;
  return NextResponse.json({queued:rows.length,notice:'Awaiting administrator approval'});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Sync failed'},{status:502});}
}
