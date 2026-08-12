Feature: Instant share capture

  As a user
  I want choosing Later from the Android Share Sheet to save the shared content immediately
  So that saving something requires no additional decision or tap

  Scenario: Authenticated user shares a URL
    Given I am signed in to Later
    And another app shares a valid URL to Later
    When Later receives the share
    Then the shared item is saved automatically
    And I am not asked to confirm the save
    And the item is created with status "inbox"

  Scenario: Authenticated user shares plain text
    Given I am signed in to Later
    And another app shares plain text with no URL to Later
    When Later receives the share
    Then the shared text is saved automatically
    And I am not asked to confirm the save
    And the item is created with status "inbox"

  Scenario: Successful capture does not require metadata enrichment
    Given I am signed in to Later
    And another app shares a URL to Later
    And metadata for that URL is unavailable, slow, or invalid
    When Later receives the share
    Then the original shared content is saved successfully
    And saving does not wait for metadata enrichment
    And metadata failure does not cause the capture to fail

  Scenario: Shared content survives authentication
    Given I am not signed in to Later
    And another app shares valid content to Later
    When Later receives the share
    Then the shared content is preserved
    And I am directed through authentication
    When authentication succeeds
    Then the preserved shared content is saved automatically
    And I am not asked to confirm the save

  Scenario: Invalid empty share is not saved
    Given I am signed in to Later
    And Later receives a share containing neither a URL nor meaningful text
    When the capture is processed
    Then no item is created
    And Later reports that the capture could not be saved

  Scenario: Successful save gives lightweight feedback
    Given I am signed in to Later
    And Later receives valid shared content
    When the item has been persisted successfully
    Then Later indicates that the item was saved
    And no further action is required from me

  Scenario: Persistence failure does not falsely report success
    Given I am signed in to Later
    And Later receives valid shared content
    And the item cannot be persisted
    When the capture is processed
    Then Later does not report the item as saved
    And Later shows a lightweight failure state
