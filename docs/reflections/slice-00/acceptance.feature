Feature: Slice 0 foundation
  Slice 0 establishes a safe, deployable foundation without implementing product behavior.

  Rule: The project skeleton is runnable

    Scenario: The application starts successfully in development
      Given the repository has been cloned
      And all required non-secret dependencies are installed
      And valid local environment variables are available
      When the development server is started
      Then the application should start without configuration errors
      And the root application URL should respond successfully

    Scenario: The application uses the selected stack
      Given the project repository
      When I inspect the application configuration
      Then the application should use Next.js
      And the application should use TypeScript
      And no separate backend application should be required

  Rule: Health verifies the deployed application and database without mutating data

    Scenario: Health succeeds when application and database are available
      Given the health-check database object has been provisioned
      And the database is reachable
      When I request the health endpoint
      Then the endpoint should execute a read-only database query
      And the query should return a numeric result
      And the response status should be 200
      And the application status should be "ok"
      And the database status should be "ok"

    Scenario: Repeated health checks do not modify the database
      Given the health-check database object already exists
      When I request the health endpoint multiple times
      Then no database rows should be created
      And no database rows should be updated
      And no database rows should be deleted

    Scenario: A missing health-check object is unhealthy
      Given the health-check database object does not exist
      When I request the health endpoint
      Then the response status should be 503
      And the response should indicate that the database check failed
      And the health endpoint should not attempt to create the missing object

    Scenario: A database outage is unhealthy
      Given the application is running
      And the database cannot be reached
      When I request the health endpoint
      Then the response status should be 503
      And the response should not expose credentials or internal connection details

  Rule: A public repository does not expose secrets or personal data

    Scenario: Real environment files are excluded from Git
      Given the project contains a .gitignore file
      When I inspect its rules
      Then local environment files containing secrets should be ignored
      And .env.example should remain eligible for committing

    Scenario: Required configuration is documented without secrets
      Given the project requires environment variables
      When I inspect .env.example
      Then every required environment variable name should be documented
      And no real credential values should be present

    Scenario: Server-side secrets are not exposed to browser code
      Given the application has server-only credentials
      When the project is built
      Then server-only credentials should not be available in client-side code
      And server-only credentials should not be prefixed as public environment variables

    Scenario: The public repository contains no personal inbox data
      Given the repository is intended to be public
      When committed test fixtures and data files are inspected
      Then they should contain only synthetic test data
      And they should not contain actual saved links or notes

  Rule: Invalid changes are stopped before production deployment

    Scenario: Tests can be executed with one documented command
      Given dependencies are installed
      When I run the documented test command
      Then the automated test suite should execute
      And the command should return success when all tests pass

    Scenario: A failing test causes validation to fail
      Given an automated test fails
      When the test command finishes
      Then the command should return a non-zero exit status

    Scenario: The production build is validated before deployment
      Given a change has been pushed to the production branch
      When pre-deployment validation runs
      Then TypeScript checks should run
      And automated tests should run
      And repository safety checks should run
      And a production build should be attempted
      And deployment should not proceed if a required validation fails

  Rule: Valid changes are deployed and verified automatically

    Scenario: A valid change reaches production successfully
      Given I have pushed a change to the production branch
      And all pre-deployment checks pass
      When the deployment workflow runs
      Then any required Supabase migrations should be applied
      And the Vercel deployment should complete successfully
      And the post-deployment acceptance suite should run
      And all applicable acceptance scenarios should pass
      And the workflow should report success

    Scenario: Database migrations are deployed only when migrations changed
      Given all pre-deployment checks pass
      When no file under supabase/migrations has changed
      Then the workflow should not apply a Supabase database migration

    Scenario: A deployed release is verified against production
      Given a new version has been deployed
      When the production acceptance suite runs
      Then it should call the deployed application over HTTPS
      And it should validate the database-backed health endpoint
      And it should produce a clear pass or fail result

  Rule: Slice 0 does not expand into product functionality

    Scenario: Product behavior is not implemented prematurely
      Given Slice 0 is complete
      When I inspect the application
      Then item capture does not need to be implemented
      And inbox behavior does not need to be implemented
      And Done and Keep actions do not need to be implemented
      And search does not need to be implemented
      And Android Share Target does not need to be implemented
      And browser capture does not need to be implemented
      And the iOS Shortcut does not need to be implemented
