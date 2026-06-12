// cypress/e2e/auth/login.cy.ts

describe('Login flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  const validUser = {
    email: 'testm1@gmail.com',
    password: '123456',
    role: 'MANAGER'
  }

  // ── Happy path

  it('logs in with valid credentials and redirects to home', () => {
    cy.intercept('POST', '**/auth/login').as('loginRequest');

    cy.get('[data-cy="email-input"]').type(validUser.email);
    cy.get('[data-cy="password-input"]').type(validUser.password);
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 201);
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
  });

  it('stores access_token and user in localStorage after login', () => {
    cy.intercept('POST', '**/auth/login').as('loginRequest');

    cy.get('[data-cy="email-input"]').type(validUser.email);
    cy.get('[data-cy="password-input"]').type(validUser.password);
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait('@loginRequest');

    cy.window().then((win) => {
      const token = win.localStorage.getItem('access_token');
      expect(token).to.exist;
      expect(token).to.not.empty;
      const user = JSON.parse(win.localStorage.getItem('user')!);
      expect(user.email).to.eq(validUser.email);
      expect(user.role).to.eq(validUser.role);
    });
  });

  // ── Validation

  it('shows email required error when email is touched and empty', () => {
    cy.get('[data-cy="email-input"]').focus().blur();
    cy.get('[data-cy="email-input"]')
      .siblings('.error-message')
      .should('contain', 'Email is required');
  });

  it('shows invalid email error on bad email format', () => {
    cy.get('[data-cy="email-input"]').type('not-an-email').blur();
    cy.get('[data-cy="email-input"]').siblings('.error-message').should('contain', 'Invalid Email');
  });

  it('enables submit button only when both fields are valid', () => {
    cy.get('[data-cy="email-input"]').type('user@test.com');
    cy.get('[data-cy="password-input"]').type('secret123');
    cy.get('[data-cy="submit-btn"]').should('not.be.disabled');
  });

  // ── Error responses

  it('shows error modal when credentials are wrong', () => {
    cy.intercept('POST', '**/auth/login').as('failedLogin');

    cy.get('[data-cy="email-input"]').type(validUser.email);
    cy.get('[data-cy="password-input"]').type('wrongpassword');
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait('@failedLogin');
    cy.get('[data-cy="error-modal"]').should('be.visible');
  });

  it('shows error modal when user is not found', () => {
    cy.intercept('POST', '**/auth/login').as('notFound');

    cy.get('[data-cy="email-input"]').type('wrongemail@gmail.com');
    cy.get('[data-cy="password-input"]').type('123456');
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait('@notFound');
    cy.get('[data-cy="error-modal"]').should('be.visible');
  });

  it('re-enables submit button after a failed login', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 400,
      body: { message: 'Incorrect Password' },
    });

    cy.get('[data-cy="email-input"]').type('user@test.com');
    cy.get('[data-cy="password-input"]').type('wrongpassword');
    cy.get('[data-cy="submit-btn"]').click();

    cy.get('[data-cy="submit-btn"]').should('not.be.disabled');
  });
});
