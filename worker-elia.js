// Cloudflare Worker for إيليا — اربطه بمتغير AI في Cloudflare Workers & Pages
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Use POST', { status: 405, headers: cors });
    if (!env.AI) return Response.json({ error: 'AI binding is missing' }, { status: 503, headers: cors });
    try {
      const body = await request.json();
      const question = String(body.message || '').slice(0, 1200);
      const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
      const messages = [
        { role: 'system', content: 'اسمك إيليا، مساعد متجر معاملات خيبر. أجب دائماً بالعربية وباللهجة العراقية الشعبية الواضحة، بأسلوب مهذب ومختصر. ساعد في التنقل بين أقسام المتجر وشرح طريقة الطلب. لا تخترع أسعاراً أو توفر منتجات أو تؤكد دفعاً؛ اطلب من الزبون مراجعة السعر الظاهر في الصفحة والتواصل مع صاحب المتجر عند الحاجة. إذا لم تعرف قل ذلك بصراحة. لا تطلب كلمات مرور أو بيانات حساسة. لا تدّع أنك إنسان.' },
        ...history.filter(x => x && ['user','assistant'].includes(x.role)).map(x => ({ role: x.role, content: String(x.content || '').slice(0, 1000) })),
        { role: 'user', content: question }
      ];
      const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages, max_tokens: 350 });
      return Response.json({ reply: result.response || 'عذراً، ما كدرت أجهّز جواب هالمرة.' }, { headers: cors });
    } catch (e) {
      return Response.json({ error: 'تعذر إكمال الطلب حالياً' }, { status: 500, headers: cors });
    }
  }
};
