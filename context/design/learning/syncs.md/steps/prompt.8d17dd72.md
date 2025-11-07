---
timestamp: 'Thu Nov 06 2025 20:33:29 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_203329.3d039c03.md]]'
content_id: 8d17dd726d1659a87eb90d2ecca6907cfbeb81ff6cb9939b7b085f4415ea4d40
---

# prompt: can you help me fix startFileTrackingUsingLLM

export const StartTrackingFileLLMRequest: Sync = (

{ request, session, user, file, fileInput, maxIndex },

) => ({

when: actions(\[Requesting.request, {

path: "/FileTracker/startTrackingUsingLLM",

session,

}, { request }]),

where: async (frames) => {

let sessionFrames = await frames.query(Sessioning.\_getUser, { session }, {

user,

});

sessionFrames = sessionFrames.filter(($) => $\[user] !== null);

if (sessionFrames.length === 0) {

return frames;

}

return sessionFrames;

},

then: actions(\[FileTracker.startTrackingUsingLLM, {

owner: user,

file,

fileInput,

fileMaxIndex: maxIndex,

}, { file }]),

});

export const StartTrackingFileLLMResponse: Sync = ({ request, file }) => ({

when: actions(

\[Requesting.request, { path: "/FileTracker/startTrackingUsingLLM" }, {

request,

}],

\[FileTracker.startTrackingUsingLLM, {}, { file }],

),

then: actions(\[Requesting.respond, {

request,

status: "started file tracking",

}]),

});

export const StartTrackingFileLLMResponseError: Sync = (

{ request, error },

) => ({

when: actions(

\[Requesting.request, { path: "/FileTracker/startTrackingUsingLLM" }, {

request,

}],

\[FileTracker.startTrackingUsingLLM, {}, { error }],

),

then: actions(\[

Requesting.respond,

{ request, error },

]),

});
