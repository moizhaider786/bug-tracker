describe('Project flow', () => {
  let projectId: string;
  after(() => {
    cy.managerLoginViaApi().then(() => {
      console.log('Project Deletion User ', window.localStorage.getItem('user'));
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/project/${projectId}`,
        headers: { Authorization: `Bearer ${window.localStorage.getItem('access_token')}` },
      });
    });
  });

  it('should let manager create unique title project', () => {
    cy.intercept('POST', '**/project').as('createProject');
    cy.managerLoginViaApi();

    cy.visit('/projects');
    cy.get('[data-cy="create-project-btn"]').click();

    const title = `New Project - ${Date.now()}`;
    cy.get('[data-cy="title-input"]').type(title);
    cy.get('[data-cy="description-input"]').type('Test description');
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait('@createProject').then((intercpt) => {
      projectId = intercpt?.response?.body.id || null;
    });
  });

  it('should not show project action buttons to QA and Developer', () => {
    cy.qaLoginViaApi();
    cy.visit('/projects');

    cy.get('[data-cy="create-project-btn"]').should('not.exist');
    cy.get('[data-cy="project-manager-actions-container"]').should('not.exist');

    cy.devLoginViaApi();
    cy.reload();

    cy.get('[data-cy="create-project-btn"]').should('not.exist');
    cy.get('[data-cy="project-manager-actions-container"]').should('not.exist');
  });
});
