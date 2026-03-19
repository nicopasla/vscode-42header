import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/src/tests/extension.test.js',
  mocha: {
    timeout: 10000
  }
});