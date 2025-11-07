
# Overall Changes From Assignment 2 to 4c

## Aesthetic Changes
- Abbreviation Reference Interaction 
	- Initial Concept (A2 + A4a): Users would click on an abbreviation to expand it inline
	- Final Implementation (4b): Switched to **hover-to-reveal** behavior. This reduced unnecessary clicks and better aligned with how users can quickly reference definitions without needing them to stay permanently expanded. The hover also kept the UI cleaner. 
- Add Image
	- Initial Concept (A2 + A4a): In my [Upload Pattern](https://github.com/christinew7/61040-portfolio/blob/main/assignments/assignment2_ui.md#upload-pattern) page, I originally only had the user submit a title and their pattern text to keep the process frictionless. 
	- Final Implementation (4b): I added an [optional image attachment](../media/updated%20upload%20pattern.png). This image is displayed on the Library page, allowing each pattern to show its actual project image rather than a generic crochet placeholder. This improves personalization, visual recognition, and helps users quickly identify patterns at a glance. 
## Implementation Changes
- Language Toggle
	- Initial Concept (A2): I assumed the system could automatically infer whether a pattern was written in US or UK English. I did not consider the implementation complexity of this detection. This automation would probably require an LLM to help, and even then, the similarity between the two variants would make this unreliable and prone to errors. 
	- Final Implementation (4a): Ultimately, I added an explicitly language selector drop down for the user to choose what language their pattern is in, but now toggling only switches the output language—not the detected input—ensuring clarity and avoiding incorrect automatic assumptions.
- Row Tracker
	- In [Assignment 2](https://github.com/christinew7/61040-portfolio/blob/main/assignments/assignment2_app_pitch.md), I added an additional mini feature in the Row Tracking system that tracks the progress of the pattern as well. I didn't end up adding this implementaiton for submission to prioritize the core functionality of the Row Tracker tool, which is to improve user focus on a row of the pattern and not be distracted when returning to the pattern after successfully crocheting a row. 
- StartTracking / Automatically find the first instruction of the pattern
	- I originally didn't have this as a feature and was going to default the first instruction to the first line of the pattern, until the user updates it because usually they would send this pattern as they're starting to crochet, not when they're in the middle of it. 
	- I added startTrackingUsingLLM as my AI-Augmented Feature to help me try to find the first instruction, and it was pretty accurate and useful! I realized I had to this feature's implementation and my Library concept because I was passing in a composite object (an array of Strings), so I added a query, `_getFileString` that returns the stringified array in JSON format so the LLM can properly parse it. I used Gemini to help me brainstorm and add the initial changes to the spec and implementation in Library: [_.e46ab544](../context/design/reflections%20snapshots.md/steps/_.e46ab544.md)

# Backend Concept Changes

- I added a query to get the user's username for display on the Library page. 
- I had to change the spec to my `FileTracker` to pass in the maxIndex (size of the File) in the `startTracking` action because this would keep the concepts modular. Otherwise, I would have to use the `File` concept to query the file and then calculate the size from there and pass it into my `FileTracker` concept.
- Functionally for my frontend, the first item in the file is the title, so there is no purpose is going back from the first line of the pattern to highlight the title, so I changed my concept to take 1 as the minimum index.
- Two of my features both use the Dictionary concept (translating from one language to another and translating from a phrase to its abbreviated term). Since these are basically the same thing, I kept it as one concept. I modified my concept to have a 'type' parameter to help me determine what I'm mapping to.
## Concept Testing
- I updated the `PasswordAuthentication` concept so it would not take empty usernames. I got this idea to change with the LLM's [generated test cases](../context/design/reflections%20snapshots.md/steps/_.02602d99.md)! It didn't make sense to me to have an empty username (in the real world) so I decided to have stronger preconditions in the `register` action.
- I changed the `Dictionary` concept to have the terms be case insensitive because the cases don't matter in this context. I got this fix from the [LLM's generated test cases](../context/design/reflections%20snapshots.md/20251016_192650.a649f3b7.md). The test cases provided were made to check that the translation is only valid if the cases match, but this shouldn't matter because "Hello" and "hello" ultimately have the same meaning if someone asked to translate it to a different language.