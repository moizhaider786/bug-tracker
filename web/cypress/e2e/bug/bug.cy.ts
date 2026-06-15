import { User } from '../../../src/app/core/models/user.model';
import { UserRoles } from '../../../src/app/types/types';
const newBug = {
  title: `Test Bug - ${Date.now()}`,
  description: 'This is a test bug',
};

describe('Bug Flow', () => {
  it('should let project qa create a bug', () => {
    cy.intercept(`**/project/*/members?role=${UserRoles.DEVELOPER}`).as('getProjectDevelopers');

    cy.qaLoginViaApi();
    cy.visit('/projects');
    cy.get('[data-cy="details-btn"]').eq(0).click();
    cy.get('[data-cy="report-bug-link"]').click();

    cy.wait('@getProjectDevelopers').then((intercept) => {
      const developers = intercept.response?.body as User[];
      
      console.log('developers ', developers);
      cy.wrap(developers).as('developersList');
    });
    // cy.get('@developersList').should('not.be.empty');
    cy.get('[data-cy="time-inputs-container"]').should('not.exist');
    cy.get('[data-cy="title-input"]').type(newBug.title);
    cy.get('[data-cy="description-input"]').type(newBug.description);
    cy.get('@developersList').then((developers) => {
      const devList = developers as User[];
      console.log("dev list ", devList)
      cy.get('[data-cy="developer-select"]').select(devList ? devList[0].id.toString() : []);
    });

    cy.get('[data-cy="create-bug-btn"]');
  });
});
