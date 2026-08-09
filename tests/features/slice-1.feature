Feature: Deferred Attention core inbox

  Background:
    Given a valid authenticated user exists

  Scenario: Capture a URL
    When the user saves a URL
    Then a new item should be created
    And the item should belong to that user
    And the item status should be "inbox"

  Scenario: Capture plain text without a URL
    When the user saves plain text with no URL
    Then a new item should be created
    And the item's URL should be null
    And the raw text should be preserved

  Scenario: Capture does not require optional metadata
    When the user saves an item without a title
    And without a note
    And without a source type
    Then the item should still be created successfully

  Scenario: Duplicate URLs are allowed
    Given the user has already saved a URL
    When the user saves the same URL again
    Then another item should be created

  Scenario: Inbox returns only inbox items
    Given the user has inbox, done and kept items
    When the user's inbox is requested
    Then only items with status "inbox" should be returned

  Scenario: Inbox is ordered newest first
    Given the user has several inbox items saved at different times
    When the user's inbox is requested
    Then the newest item should appear first

  Scenario: Empty inbox is valid
    Given the user has no inbox items
    When the user's inbox is requested
    Then the request should succeed
    And an empty list should be returned

  Scenario: Mark an inbox item Done
    Given the user has an item with status "inbox"
    When the user marks that item Done
    Then the item's status should become "done"
    And its updated_at timestamp should change

  Scenario: Mark an inbox item Kept
    Given the user has an item with status "inbox"
    When the user marks that item Keep
    Then the item's status should become "kept"
    And its updated_at timestamp should change

  Scenario: A user sees only their own inbox
    Given User A has inbox items
    And User B has inbox items
    When User A requests their inbox
    Then User A should receive only User A's items

  Scenario: A user cannot change another user's item
    Given an item belongs to User B
    When User A attempts to mark that item Done
    Then the operation should be rejected
    And the item should remain unchanged

  Scenario: Save a URL manually
    When the user enters a URL in the manual capture control
    And saves it
    Then the item should appear in the inbox

  Scenario: Save plain text manually
    When the user enters plain text
    And saves it
    Then the text item should appear in the inbox

  Scenario: Saved item appears on another client
    Given Client A and Client B are authenticated as the same user
    When Client A saves an item
    And Client B reloads the application
    Then Client B should see the saved item
