import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { bases, extras, ingredients } from '@/lib/menu';

const RequestSchema=z.object({prompt:z.string().trim().min(3).max(1000)});
const BuildSchema=z.object({base:z.string(),format:z.enum(['Маки','Футомаки','Урамаки','Нигири','Темаки','Авторский ролл']),wrap:z.enum(['Нори','Соевый лист','Без обёртки']),items:z.record(z.number().int().min(0).max(5)),extras:z.record(z.number().int().min(0).max(5))});
const formats=['Маки','Футомаки','Урамаки','Нигири','Темаки','Авторский ролл'] as const;
function demo(prompt:string){
 const p=prompt.toLowerCase();const excluded=ingredients.filter(x=>p.includes(`без ${x.name.toLowerCase()}`)||p.includes(`не добавляй ${x.name.toLowerCase()}`)).map(x=>x.name);
 const items:Record<string,number>={};for(const x of ingredients){if(!excluded.includes(x.name)&&p.includes(x.name.toLowerCase()))items[x.name]=1}
 if(!Object.keys(items).length){if(p.includes('овощ')){items['Авокадо']=1;items['Огурец']=1;items['Спаржа']=1}else if(p.includes('остр')){items['Тунец']=1;items['Авокадо']=1}else{items['Лосось']=1;items['Авокадо']=1;items['Сливочный сыр']=1}}
 const selectedExtras:Record<string,number>={};if(p.includes('трюф'))selectedExtras['Трюфельный соус']=1;if(p.includes('остр')||p.includes('спайси'))selectedExtras['Спайси-майо']=1;
 const format=p.includes('нигири')?'Нигири':p.includes('темаки')?'Темаки':p.includes('маки')?'Маки':'Урамаки';
 return {base:bases[0].name,format,wrap:'Нори',items,extras:selectedExtras};
}
export async function POST(req:Request){try{
 const parsed=RequestSchema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:'Введите запрос длиной от 3 до 1000 символов.'},{status:400});
 const prompt=parsed.data.prompt;let build:unknown;let message='Демо-помощник собрал рецепт из доступных ингредиентов. Проверьте состав и настройте его по вкусу.';
 if(process.env.OPENAI_API_KEY){const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});const response=await client.chat.completions.create({model:process.env.OPENAI_MODEL||'gpt-4o-mini',temperature:.2,response_format:{type:'json_object'},messages:[{role:'system',content:`Ты — помощник меню японского ресторана. Составляй рецепт ТОЛЬКО из перечисленного каталога. Никогда не выдумывай продукты или цены. Учитывай запреты и аллергии, если пользователь их упоминает: исключи явно запрещённые ингредиенты. Если запрос связан с аллергией, добавь предупреждение, что состав нужно подтвердить с персоналом из-за риска перекрёстного контакта. Верни только JSON: {"build":{"base":"...","format":"...","wrap":"...","items":{"название":количество},"extras":{"название":количество}},"message":"короткое пояснение"}. base одно из: ${bases.map(x=>x.name).join('; ')}. format одно из: ${formats.join('; ')}. wrap: Нори, Соевый лист, Без обёртки. ingredients: ${ingredients.map(x=>x.name).join('; ')}. extras: ${extras.map(x=>x.name).join('; ')}. Количество каждого 1-2.`},{role:'user',content:prompt}]});const raw=response.choices[0]?.message?.content||'{}';const result=JSON.parse(raw);build=result.build;message=String(result.message||message);
 }else{build=demo(prompt)}
 const valid=BuildSchema.safeParse(build);if(!valid.success)return NextResponse.json({error:'AI вернул некорректный рецепт. Попробуйте переформулировать запрос.'},{status:502});
 const allowedBase=bases.some(x=>x.name===valid.data.base);if(!allowedBase)return NextResponse.json({error:'Неизвестная основа в рецепте.'},{status:502});
 const allowedItems=Object.keys(valid.data.items).every(n=>ingredients.some(x=>x.name===n));const allowedExtras=Object.keys(valid.data.extras).every(n=>extras.some(x=>x.name===n));if(!allowedItems||!allowedExtras)return NextResponse.json({error:'Рецепт содержит ингредиент вне каталога HAITANI.'},{status:502});
 return NextResponse.json({build:valid.data,message,mode:process.env.OPENAI_API_KEY?'ai':'demo'});
 }catch(error){console.error('AI compose error',error);return NextResponse.json({error:'Не удалось создать рецепт. Попробуйте ещё раз.'},{status:500})}}
