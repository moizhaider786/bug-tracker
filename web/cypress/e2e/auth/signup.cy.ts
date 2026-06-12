// cypress/e2e/auth/signup.cy.ts

describe('Signup flow', () => {
  beforeEach(() => {
    cy.visit('/signup');
  });

  const getUser = (overwrite = {}) => {
    return {
      id: 1,
      name: 'New User',
      email: 'newuser@test.com',
      role: 'MANAGER',
      password: 'secret123',
      confirmPassword: 'secret123',
      createdAt: new Date(),
      ...overwrite
    };
  };
  // ── Happy path

  it('signs up successfully with valid data', () => {
    const {confirmPassword, password, ...user} = getUser()
    cy.intercept('POST', '**/auth/signup', {
      statusCode: 201,
      body: user,
    }).as('signupRequest');

    cy.get('[data-cy="name-input"]').type(user.name);
    cy.get('[data-cy="email-input"]').type(user.email);
    cy.get('[data-cy="role-select"]').select(user.role);
    cy.get('[data-cy="password-input"]').type(password);
    cy.get('[data-cy="confirm-password-input"]').type(confirmPassword);
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait('@signupRequest').its('response.statusCode').should('eq', 201);
    cy.get('[data-cy="success-toast"]').should('contain', 'Signup successful');
  });

  //   // ── Validation ──────────────────────────────────────────────────────

  it('keeps submit disabled when form is empty', () => {
    cy.get('[data-cy="submit-btn"]').should('be.disabled');
  });

  it('shows name required error', () => {
    cy.get('[data-cy="name-input"]').focus().blur();
    cy.get('[data-cy="name-input"]').siblings('.error-message').should('be.visible');
  });

  it('shows role required error', () => {
    cy.get('[data-cy="role-select"]').focus().blur();
    cy.get('[data-cy="role-select"]').siblings('.error-message').should('be.visible');
  });

  it('shows password minlength error', () => {
    cy.get('[data-cy="password-input"]').type('abc').blur();
    cy.get('[data-cy="password-input"]').siblings('.error-message').should('be.visible');
  });

  it('shows confirm password required error', () => {
    cy.get('[data-cy="confirm-password-input"]').focus().blur();
    cy.get('[data-cy="confirm-password-input"]').siblings('.error-message').should('be.visible');
  });

  // ── Error responses ─────────────────────────────────────────────────

  it('shows error modal when email already exists', () => {
    const user = getUser({
      email: 'testm1@gmail.com'
    })
    cy.intercept('POST', '**/auth/signup').as('conflictSignup');

    cy.get('[data-cy="name-input"]').type(user.name);
    cy.get('[data-cy="email-input"]').type(user.email);
    cy.get('[data-cy="role-select"]').select(user.role);
    cy.get('[data-cy="password-input"]').type(user.password);
    cy.get('[data-cy="confirm-password-input"]').type(user.confirmPassword);
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait('@conflictSignup');
    cy.get('[data-cy="error-modal"]').should('contain', 'User already Exists');
  });
});
