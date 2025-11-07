# Test Execution Output

## PasswordAuthentication
```
deno test src/concepts/PasswordAuthentication/PasswordAuthenticationConcept.test.ts --allow-all

running 4 tests from ./src/concepts/PasswordAuthentication/PasswordAuthenticationConcept.test.ts

PasswordAuthentication: Principle: User registers with a username and password, then they can login with the same username and password and be treated as the same user ...
  1. User successfully creates account with username and password ... ok (71ms)
  2. User can authenticate with the same username and password ... ok (18ms)
  3. Verify Identity: Re-authentication confirms the user is treated as the same user. ... ok (18ms)
PasswordAuthentication: Principle: User registers with a username and password, then they can login with the same username and password and be treated as the same user ... ok (665ms)

Action: register ...
  1. Effects: successful registration creates a user and its state is verifiable. ... ok (72ms)
  2. Cannot register with an existing username ... ok (38ms)
Action: register ... ok (636ms)

Action: authenticate ...
  1. User cannot authenticate with incorrect password ... ok (164ms)
  2. User cannot authenticate with a nonexistent username ... ok (18ms)
Action: authenticate ... ok (780ms)

Edge Cases: Empty/Case sensitive inputs ...
  1. Register with empty username ... ok (0ms)
  2. Register with empty password ... ok (54ms)
  3. Usernames are case sensitive ... ok (138ms)
  4. Passwords are case sensitive ... ok (90ms)
Edge Cases: Empty/Case sensitive inputs ... ok (872ms)

ok | 4 passed (11 steps) | 0 failed (2s)
```

## Dictionary
```
running 6 tests from ./src/concepts/Dictionary/DictionaryConcept.test.ts

Principle: the dictionary maintains a mapping of terms between two languages, a user can request the translation of a term, and the dictionary will provide the appropriate term in the other language ...
  1. Add one crochet translation term ... ok (77ms)
  2. User requests translation from US to UK term for this term ... ok (19ms)
Principle: the dictionary maintains a mapping of terms between two languages, a user can request the translation of a term, and the dictionary will provide the appropriate term in the other language ... ok (785ms)

Action: addTerm ...
  1. Cannot add duplicate terms ... ok (84ms)
  2. Can still access the original term ... ok (21ms)
Action: addTerm ... ok (722ms)

Action: type validation and abbreviation support ...
  1. Can add term with 'abbreviation' type ... ok (69ms)
  2. Invalid type is rejected ... ok (0ms)
Action: type validation and abbreviation support ... ok (550ms)

Action: deleteTerm ...
  1. Successfully delete existing term ... ok (141ms)
  2. Cannot delete an already deleted term ... ok (22ms)
  3. Add back a deleted term ... ok (56ms)
Action: deleteTerm ... ok (791ms)

Action: translateTerm - both ways ...
  1. Can translate from language1 ... ok (17ms)
  2. Can translate from language2 ... ok (17ms)
  3. Cannot translate from language1 using language2 ... ok (15ms)
  4. Cannot translate from language2 using language1 ... ok (15ms)
Action: translateTerm - both ways ... ok (629ms)

Action: case insensitivity for addTerm, deleteTerm, and translateTerm ...
  1. Cannot add term with different case ... ok (20ms)
  2. Can translate from language 1 with different case ... ok (20ms)
  3. Can translate from language 2 with different case ... ok (19ms)
  4. Can delete term with different case ... ok (40ms)
Action: case insensitivity for addTerm, deleteTerm, and translateTerm ... ok (632ms)

ok | 6 passed (17 steps) | 0 failed (4s)
```

## Library
```
running 6 tests from ./src/concepts/Library/LibraryConcept.test.ts

Principle: a user creates a library to store their files, can add, retrieve, modify, or delete files within their library, can delete the library if it's no longer needed ...
  1. Alice creates a library to store her files ... ok (98ms)
  2. Alice adds one file to her library ... ok (230ms)
  3. Alice modifies her file in her library ... ok (109ms)
  4. Alice deletes a file; she no longer needs it ... ok (76ms)
Principle: a user creates a library to store their files, can add, retrieve, modify, or delete files within their library, can delete the library if it's no longer needed ... ok (1s)

Action: duplicates (create and file operations) ...
  1. Duplicate library is not allowed ... ok (72ms)
  2. Can create multiple files, even empty ones ... ok (131ms)
  3. addItemToFile allows duplicate item strings ... ok (155ms)
Action: duplicates (create and file operations) ... ok (917ms)

Action: delete and deleteFile ...
  1. Cannot delete a library for a nonexistent owner ... ok (17ms)
  2. Cannot delete an existing file under a nonexisting owner ... ok (17ms)
  3. Cannot delete an existing file under an existing user, but doesn't belong in their library ... ok (33ms)
Action: delete and deleteFile ... ok (971ms)

Actions: createFile, addItemToFile, modifyItemInFile, removeItemFromFile, deleteFile ...
  Setup: Alice creates a library and two files ... ok (398ms)
  1. addItemToFile: adds an item to a file ... ok (105ms)
  2. addItemToFile: requires existing library/file ... ok (61ms)
  3. modifyItemInFile: replaces an item at a specific index ... ok (108ms)
  4. modifyItemInFile: requires existing library/file and valid index ... ok (158ms)
  5. removeItemFromFile: removes an item at a specific index ... ok (105ms)
  6. removeItemFromFile: requires existing library/file and valid index ... ok (142ms)
Actions: createFile, addItemToFile, modifyItemInFile, removeItemFromFile, deleteFile ... ok (1s)

Multiple users manage their independent libraries ...
  1. Alice creates a library and adds a file with an item ... ok (205ms)
  2. Bob creates a library and adds some files with items ... ok (330ms)
  3. Alice modifies an item in her file after Bob ... ok (98ms)
  4. Bob deletes one of his files ... ok (122ms)
Multiple users manage their independent libraries ... ok (1s)

Updated Image Actions: setImageToFile, clearImageFromFile ...
  1. setImageToFile: sets an image for a file ... ok (89ms)
  2. setImageToFile: requires existing library/file ... ok (51ms)
  3. clearImageFromFile: clears the image for a file ... ok (89ms)
  4. clearImageFromFile: requires existing library/file ... ok (51ms)
Updated Image Actions: setImageToFile, clearImageFromFile ... ok (1s)

ok | 6 passed (25 steps) | 0 failed (6s)

```

## FileTracker
```
running 7 tests from ./src/concepts/FileTracker/FileTrackerConcept.test.ts

Principle: a user starts tracking their file from the first listed item, they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed ...
  1. User starts tracking a file normally (without LLM) ... ok (80ms)
  2. User moves sequentially through file items (next and back) ... ok (104ms)
  3. User skips to a specific file item (jumpTo) ... ok (50ms)
  4. User controls how their progress is displayed (setVisibility) ... ok (103ms)
Principle: a user starts tracking their file from the first listed item, they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed ... ok (821ms)

Action: startTracking ...
  1. User tries to track an already tracked file ... ok (56ms)
  2. Multiple users can track the same file (succeeds) ... ok (196ms)
  3. One user can track multiple distinct files (succeeds) ... ok (83ms)
Action: startTracking ... ok (896ms)

Action: deleteTracking ...
  1. Delete an existing tracking record ... ok (112ms)
  2. Try to delete a non-existent tracking record (fails) ... ok (21ms)
Action: deleteTracking ... ok (682ms)

Action: next, back, jumpTo ...
  1. User can click next multiple times in a row ... ok (228ms)
  2. User can click back multiple times in a row ... ok (179ms)
  3. User cannot hit back if it's on the first item ... ok (35ms)
  3. User cannot hit next if it's on the last item ... ok (73ms)
  4. User can jump to the same item (no change) ... ok (115ms)
  5. User cannot jump to an invalid index (negative, out of bounds, non-integer) ... ok (128ms)
Action: next, back, jumpTo ... ok (1s)

All navigation and visibility actions fail on a non-existent tracking record ...
  1. Nonexistent user tries to go next ... ok (17ms)
  2. Nonexistent user tries to go back ... ok (19ms)
  3. Nonexistent user tries to jumpTo ... ok (18ms)
  4. Nonexistent user tries to change visibility ... ok (17ms)
All navigation and visibility actions fail on a non-existent tracking record ... ok (608ms)

Action: setVisibility ...
  1. Set visibility to true when already true (no change, no error) ... ok (50ms)
  2. Set visibility to false when already false (no change, no error) ... ok (87ms)
  . Attempt to set visibility with an invalid (non-boolean) 'visible' parameter ... ok (34ms)
Action: setVisibility ... ok (711ms)

Action: startTrackingUsingLLM with different styles of patterns ...
  1. Basic instruction with clear starting instructions ... ok (619ms)
  2. File has lots of miscellaneous comments and prep instructions before ... ok (529ms)
  3. Pattern has a lot of different instruction sections ... ok (466ms)
  4. Pattern that has been scanned with OCR errors and typos ... ok (432ms)
Action: startTrackingUsingLLM with different styles of patterns ... ok (2s)

ok | 7 passed (26 steps) | 0 failed (7s)
```
## Sessioning

```
running 1 test from ./src/concepts/Sessioning/SessioningConcept.test.ts
Sessioning Concept Tests ...
  
  Action: create - Creates a new session and associates it with a user ... ok (50ms)
  
  Action: _getUser - Returns the user for an existing session (positive case) ... ok (36ms)
  
  Action: _getUser - Returns error for a non-existent session (requires not met) ... ok (16ms)
  
  Action: delete - Removes an existing session (positive case) ... ok (53ms)
  
  Action: delete - Returns error for a non-existent session (requires not met) ... ok (16ms)
  
  Principle: User Journey - Login, Access, Logout ...
------- output -------
Trace Step 1: User logs in using user ID 'testUser123'.
Trace Step 2: User makes a subsequent request, relying on the session to identify them.
Trace Step 3: User logs out, invalidating their session.
Trace Step 4: Attempt to access resources using the invalidated session.
----- output end -----
  Principle: User Journey - Login, Access, Logout ... ok (70ms)
Sessioning Concept Tests ... ok (773ms)

ok | 1 passed (6 steps) | 0 failed (779ms)
```