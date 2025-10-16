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
deno test src/concepts/Dictionary/DictionaryConcept.test.ts --allow-all

running 5 tests from ./src/concepts/Dictionary/DictionaryConcept.test.ts

Principle: the dictionary maintains a mapping of terms between two languages, a user can request the translation of a term, and the dictionary will provide the appropriate term in the other language ...
  1. Add one crochet translation term ... ok (64ms)
  2. User requests translation from US to UK term for this term ... ok (16ms)
Principle: the dictionary maintains a mapping of terms between two languages, a user can request the translation of a term, and the dictionary will provide the appropriate term in the other language ... ok (637ms)

Action: addTerm ...
  1. Cannot add duplicate terms ... ok (71ms)
  2. Can still access the original term ... ok (18ms)
Action: addTerm ... ok (530ms)

Action: deleteTerm ...
  1. Successfully delete existing term ... ok (137ms)
  2. Cannot delete an already deleted term ... ok (19ms)
  3. Add back a deleted term ... ok (39ms)
Action: deleteTerm ... ok (823ms)

Action: translateTerm - both ways ...
  1. Can translate from language1 ... ok (20ms)
  2. Can translate from language2 ... ok (18ms)
  3. Cannot translate from language1 using language2 ... ok (18ms)
  4. Cannot translate from language2 using language1 ... ok (17ms)
Action: translateTerm - both ways ... ok (702ms)

Action: case insensitivity for addTerm, deleteTerm, and translateTerm ...
  1. Cannot add term with different case ... ok (18ms)
  2. Can translate from language 1 with different case ... ok (17ms)
  3. Can translate from language 2 with different case ... ok (17ms)
  4. Can delete term with different case ... ok (38ms)
Action: case insensitivity for addTerm, deleteTerm, and translateTerm ... ok (720ms)

ok | 5 passed (15 steps) | 0 failed (3s)
```

## Library
```
deno test src/concepts/Library/LibraryConcept.test.ts --allow-all

running 5 tests from ./src/concepts/Library/LibraryConcept.test.ts

Principle: a user creates a library to store their files, can add, retrieve, modify, or delete files within their library, can delete the library if it's no longer needed ...
  1. Alice creates a library to store her files ... ok (93ms)
  2. Alice adds one file to her library ... ok (107ms)
  3. Alice modifies her file in her library ... ok (110ms)
  4. Alice deletes a file; she no longer needs it ... ok (72ms)
Principle: a user creates a library to store their files, can add, retrieve, modify, or delete files within their library, can delete the library if it's no longer needed ... ok (932ms)

Action: duplicates (create and addFile) ...
  1. Duplicate library is not allowed ... ok (67ms)
  2. Duplicate file is not allowed ... ok (99ms)
Action: duplicates (create and addFile) ... ok (664ms)

Action: delete and deleteFile ...
  1. Cannot delete a library for a nonexistent owner ... ok (17ms)
  2. Cannot delete an existing file under a nonexisting owner ... ok (31ms)
  3. Cannot delete an existing file under an existing user, but doesn't belong in their library ... ok (42ms)
Action: delete and deleteFile ... ok (922ms)

Action: addFile and modifyFile ...
  1. Can modify file with no real changes ... ok (70ms)
  2. Can add a file with slight changes ... ok (54ms)
Action: addFile and modifyFile ... ok (783ms)

Multiple users manage their independent libraries ...
  1. Alice creates a library ... ok (144ms)
  2. Bob creates a library and adds some files ... ok (196ms)
  3. Alice modifies her file after Bob ... ok (111ms)
  4. Bob deletes one of his files ... ok (106ms)
Multiple users manage their independent libraries ... ok (1s)

ok | 5 passed (15 steps) | 0 failed (4s)
```

## FileTracker
```
deno test src/concepts/FileTracker/FileTrackerConcept.test.ts --allow-all
running 7 tests from ./src/concepts/FileTracker/FileTrackerConcept.test.ts

Principle: a user starts tracking their file from the first listed item, they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed ...
  1. User starts tracking a file normally (without LLM) ... ok (205ms)
  2. User moves sequentially through file items (next and back) ... ok (133ms)
  3. User skips to a specific file item (jumpTo) ... ok (63ms)
  4. User controls how their progress is displayed (setVisibility) ... ok (217ms)
Principle: a user starts tracking their file from the first listed item, they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed ... ok (1s)

Action: startTracking ...
  1. User tries to track an already tracked file ... ok (230ms)
  2. Multiple users can track the same file (succeeds) ... ok (255ms)
  3. One user can track multiple distinct files (succeeds) ... ok (306ms)
Action: startTracking ... ok (1s)

Action: deleteTracking ...
  1. Delete an existing tracking record ... ok (119ms)
  2. Try to delete a non-existent tracking record (fails) ... ok (18ms)
Action: deleteTracking ... ok (826ms)

Action: next, back, jumpTo ...
  1. User can click next multiple times in a row ... ok (237ms)
  2. User can click back multiple times in a row ... ok (178ms)
  3. User cannot hit back if it's on the first item ... ok (39ms)
  3. User cannot hit next if it's on the last item ... ok (89ms)
  4. User can jump to the same item (no change) ... ok (119ms)
  5. User cannot jump to an invalid index (negative, out of bounds, non-integer) ... ok (132ms)
Action: next, back, jumpTo ... ok (1s)

All navigation and visibility actions fail on a non-existent tracking record ...
  1. Nonexistent user tries to go next ... ok (17ms)
  2. Nonexistent user tries to go back ... ok (16ms)
  3. Nonexistent user tries to jumpTo ... ok (16ms)
  4. Nonexistent user tries to change visibility ... ok (16ms)
All navigation and visibility actions fail on a non-existent tracking record ... ok (619ms)

Action: setVisibility ...
  1. Set visibility to true when already true (no change, no error) ... ok (52ms)
  2. Set visibility to false when already false (no change, no error) ... ok (96ms)
  . Attempt to set visibility with an invalid (non-boolean) 'visible' parameter ... ok (34ms)
Action: setVisibility ... ok (726ms)

Action: startTrackingUsingLLM with different styles of patterns ...
  1. Basic instruction with clear starting instructions ... ok (567ms)
  2. File has lots of miscellaneous comments and prep instructions before ... ok (518ms)
  3. Pattern has a lot of different instruction sections ... ok (583ms)
  4. Pattern that has been scanned with OCR errors and typos ... ok (506ms)
Action: startTrackingUsingLLM with different styles of patterns ... ok (2s)

ok | 7 passed (26 steps) | 0 failed (8s)
```
