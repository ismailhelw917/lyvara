import { invokeLLM } from './server/_core/llm.js';

const blogPrompt = `Write a comprehensive, engaging blog post for a luxury jewelry website about minimalist gold jewelry styling. 

The post should be 1,200-1,500 words and include:
- Compelling introduction about the philosophy of minimalism in jewelry
- 4-5 main sections with clear headers about different aspects (why minimalist, styling tips, metal types, layering, investment value)
- Real-world styling scenarios (office, casual, evening)
- Discussion of gold metal types (14k, 18k, rose gold, white gold)
- Layering techniques for delicate pieces
- Investment value of quality gold jewelry
- Natural affiliate CTAs like "explore our minimalist collection" and "shop curated pieces"
- Include target keywords naturally: minimalist gold jewelry, dainty gold jewelry, simple gold jewelry

Format with markdown headers (##, ###). Write for women aged 25-45 who appreciate quality and understated elegance. Tone should be sophisticated, aspirational, yet accessible.

Start the response with just the blog post content, no preamble.`;

const response = await invokeLLM({
  messages: [
    { role: 'system', content: 'You are a luxury jewelry lifestyle writer. Write engaging, SEO-optimized blog posts that drive affiliate sales.' },
    { role: 'user', content: blogPrompt }
  ]
});

const content = response.choices[0].message.content;
if (typeof content === 'string') {
  console.log(content);
} else {
  console.error('Unexpected response format');
}
