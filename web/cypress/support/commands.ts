/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginViaApi(email: string, password: string): Chainable<void>
    }
  }
}


Cypress.Commands.add('loginViaApi', (email: string, password: string) => {
  cy.request('POST', `${Cypress.expose('apiUrl')}/auth/login`, { email, password })
    .then((res) => {
      localStorage.setItem('access_token', res.body.access_token)
      localStorage.setItem(
        'user',
        JSON.stringify({ id: res.body.id, email: res.body.email, role: res.body.role })
      )
    })
})

export {}