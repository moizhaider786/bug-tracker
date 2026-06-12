import { defineConfig } from 'cypress';

export default defineConfig({
  allowCypressEnv: false,
  expose: {
    apiUrl: 'http://localhost:3000',
  },
  e2e: {
    baseUrl: "http://localhost:4200",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
