
# Changes
- I had to change the spec to my FileTracker to pass in the maxIndex (size of the File) in the `startTracking` action because this would keep the concepts modular. Otherwise, I would have to use the File concept to query the file and then calculate the size from there and pass it into my FileTracker concept.
- I updated the PasswordAuthentication Concept so it would not take empty usernames because that wouldn't make sense in the real world
-

# Interesting Moments
- I wanted to get context / Gemini to help me with copying and pasting over the concept specs into this repo and its given format (with bullet points, like the example in LikertSurvey), but I kept struggling to prompt Gemini correctly to get the right formatting. Ultimately, I mostly reformatted the concepts by hand, and it felt like using Gemini was a waste of my time.
