import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { ink:'#090909', panel:'#151515', gold:'#C9A66B', pale:'#EAD3A4' }, fontFamily: { display:['Georgia','serif'] } } }, plugins: [] };
export default config;
