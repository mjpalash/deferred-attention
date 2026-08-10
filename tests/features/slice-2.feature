Feature: Android PWA share capture

  Background:
    Given Deferred Attention is deployed over HTTPS

  Feature: PWA installation

    Scenario: The application exposes a valid web app manifest
      When the browser requests the web app manifest
      Then the manifest should be available successfully
      And it should describe Deferred Attention as an installable application
      And it should define a start URL
      And it should define a standalone display mode
      And it should provide suitable app icons

    Scenario: The manifest registers an Android Web Share Target
      When the manifest is inspected
      Then it should define a share_target
      And the share target should accept text
      And the share target should accept URLs
      And the share target should submit to the application's share capture route


  Feature: Shared content interpretation

    Scenario: Receive a shared URL
      Given the authenticated user shares a URL from Android
      When the Web Share Target receives the share
      Then the shared URL should be treated as the item URL
      And the raw text should preserve the shared value

    Scenario: Receive shared plain text
      Given the authenticated user shares plain text with no URL
      When the Web Share Target receives the share
      Then a text-only item should be prepared
      And the item's URL should be null
      And the shared text should be preserved as raw text

    Scenario: Receive a title and URL together
      Given Android supplies a share title and a URL
      When the share is received
      Then the URL should be preserved
      And the supplied title may be preserved
      And neither value should be required for the other

    Scenario: Receive text containing a URL
      Given Android provides shared text containing a valid URL
      And does not provide a separate URL parameter
      When the share is received
      Then the capture should identify the URL where practical
      And the original shared text should still be preserved


  Feature: Zero-friction Android capture

    Scenario: Sharing does not require metadata decisions
      Given the user shares content from Android
      When the share capture flow opens
      Then the user should not be required to choose a folder
      And should not be required to choose a category
      And should not be required to choose a priority
      And should not be required to enter a title
      And should not be required to enter a note

    Scenario: Shared content can be saved with one explicit confirmation
      Given valid shared content has been received
      When the share capture interface is shown
      Then the shared content should already be populated
      And the user should be able to save it with one Save action

    Scenario: Saving shared content creates an Inbox item
      Given valid Android shared content
      When the user chooses Save
      Then exactly one item should be created
      And its status should be "inbox"
      And it should belong to the authenticated user

    Scenario: Duplicate shared URLs are allowed
      Given a URL is already in the user's inbox
      When the same URL is shared again from Android
      Then another inbox item should be created


  Feature: Authenticated Android sharing

    Scenario: An authenticated PWA user can save a share
      Given the user is already authenticated in the installed PWA
      When Android sends content to the Web Share Target
      Then the share flow should use the existing authenticated session
      And the item should be saved for that user

    Scenario: An unauthenticated share does not create anonymous data
      Given no authenticated user session exists
      When Android sends content to the Web Share Target
      Then no item should be created
      And the user should be directed to authenticate
      And the shared content should not be silently assigned to another user


  Feature: Android share persistence

    Scenario: Android-shared item appears in the normal inbox
      Given an authenticated user shares an item from Android
      And saves it successfully
      When the normal inbox is opened or refreshed
      Then the shared item should appear in the pile
      And it should participate in the same reverse-chronological ordering as manually captured items

    Scenario: Android capture uses the existing item model
      Given an item is captured through the Android Share Target
      When it is stored
      Then it should use the same items table
      And the same user ownership rules
      And the same inbox lifecycle as Slice 1 items

    Scenario: A pending share survives authentication
      Given no authenticated user session exists
      And Android shares valid content
      When the user is directed to login
      And successfully authenticates
      Then the original shared content should still be available
      And the user should be able to save it

  Feature: Real Android Share Sheet experience

    @manual
    Scenario: Deferred Attention appears in Android's native Share Sheet
      Given the PWA is installed on an Android device
      When the user shares a URL from a supported Android application
      Then Deferred Attention should appear as a native share destination

    @manual
    Scenario: Share flow requires only two intentional actions
      Given the user is viewing content in another Android application
      When the user opens Android Share
      And chooses Deferred Attention
      Then the shared content should be ready to save
      And one Save action should complete capture
      And no additional metadata decision should be required

    @manual
    Scenario: Capture feels fast enough for habitual use
      Given the user shares content from another Android app
      When Deferred Attention receives the share
      Then the capture flow should feel immediate
      And the user should not have to navigate through the main inbox before saving

    @manual
    Scenario Outline: Common Android sources can be captured
      Given the user is viewing content in <source>
      When the content is shared to Deferred Attention
      Then the relevant URL or text should be captured successfully

      Examples:
        | source         |
        | Chrome         |
        | YouTube        |
        | LinkedIn       |
        | X              |
        | plain text app |
