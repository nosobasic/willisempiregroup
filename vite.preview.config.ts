import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({root:'preview',plugins:[react()],envDir:'preview',server:{host:'127.0.0.1',port:5003,strictPort:true},build:{outDir:'../dist-preview'}});
