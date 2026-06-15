/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      managerLoginViaApi(email?: string, password?: string): Chainable<void>;
      qaLoginViaApi(email?: string, password?: string): Chainable<void>;
      devLoginViaApi(email?: string, password?: string): Chainable<void>;
    }
  }
}

const managerCreds = {
  email: 'testm1@gmail.com',
  password: '123456',
};

const qaCreds = {
  email: 'testq1@gmail.com',
  password: '123456',
};

const devCreds = {
  email: 'testq1@gmail.com',
  password: '123456',
};

Cypress.Commands.add(
  'managerLoginViaApi',
  (email = managerCreds.email, password = managerCreds.password) => {
    cy.request('POST', `${Cypress.expose('apiUrl')}/auth/login`, { email, password }).then(
      (res) => {
        localStorage.setItem('access_token', res.body.access_token);
        localStorage.setItem(
          'user',
          JSON.stringify({ id: res.body.id, email: res.body.email, role: res.body.role }),
        );
      },
    );
  },
);

Cypress.Commands.add('qaLoginViaApi', (email = qaCreds.email, password = qaCreds.password) => {
  cy.request('POST', `${Cypress.expose('apiUrl')}/auth/login`, { email, password }).then((res) => {
    localStorage.setItem('access_token', res.body.access_token);
    localStorage.setItem(
      'user',
      JSON.stringify({ id: res.body.id, email: res.body.email, role: res.body.role }),
    );
  });
});

Cypress.Commands.add('devLoginViaApi', (email = devCreds.email, password = devCreds.password) => {
  cy.request('POST', `${Cypress.expose('apiUrl')}/auth/login`, { email, password }).then((res) => {
    localStorage.setItem('access_token', res.body.access_token);
    localStorage.setItem(
      'user',
      JSON.stringify({ id: res.body.id, email: res.body.email, role: res.body.role }),
    );
  });
});
export {};
