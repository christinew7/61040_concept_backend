import { actions, Frames, Sync } from "@engine";
import { FileTracker, Requesting, Sessioning } from "@concepts";
import { resourceLimits } from "node:worker_threads";

export const JumpToRequest: Sync = (
  { request, session, user, file, index },
) => ({
  when: actions([
    Requesting.request,
    { path: "/FileTracker/jumpTo", session, file, index },
    { request },
  ]),
  where: async (frames) => {
    const framesWithUser = await frames.query(
      Sessioning._getUser,
      { session },
      { user },
    );
    const result = framesWithUser.filter(($) => $[user] != null);
    return result;
  },
  then: actions([
    FileTracker.jumpTo,
    {
      owner: user,
      file,
      index,
    },
  ]),
});

export const JumpToResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/jumpTo" }, { request }],
    [FileTracker.jumpTo, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "jumpedTo" }]),
});

export const JumpToResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/jumpTo" }, { request }],
    [FileTracker.jumpTo, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

export const NextRequest: Sync = (
  { request, session, user, file },
) => ({
  when: actions([
    Requesting.request,
    { path: "/FileTracker/next", session, file },
    { request },
  ]),
  where: async (frames) => {
    const framesWithUser = await frames.query(
      Sessioning._getUser,
      { session },
      { user },
    );
    return framesWithUser.filter(($) => $[user] != null);
  },
  then: actions([
    FileTracker.next,
    {
      owner: user,
      file,
    },
  ]),
});

export const NextResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/next" }, { request }],
    [FileTracker.next, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "next in pattern" }]),
});

export const NextResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/next" }, { request }],
    [FileTracker.next, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

export const BackRequest: Sync = (
  { request, session, user, file },
) => ({
  when: actions([
    Requesting.request,
    { path: "/FileTracker/back", session, file },
    { request },
  ]),
  where: async (frames) => {
    const framesWithUser = await frames.query(
      Sessioning._getUser,
      { session },
      { user },
    );
    return framesWithUser.filter(($) => $[user] != null);
  },
  then: actions([
    FileTracker.back,
    {
      owner: user,
      file,
    },
  ]),
});

export const BackResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/back" }, { request }],
    [FileTracker.back, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "back in pattern" }]),
});

export const BackResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/back" }, { request }],
    [FileTracker.next, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

export const SetVisibilityRequest: Sync = (
  { request, session, user, file, visible },
) => ({
  when: actions([
    Requesting.request,
    { path: "/FileTracker/setVisibility", session, file, visible },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const userFrames = await frames.query(Sessioning._getUser, { session }, {
      user,
    });
    if (userFrames.length === 0) return new Frames(); // invalid session

    const result = new Frames({
      ...originalFrame,
      [user]: userFrames[0][user], // bind user
    });
    return result;
  },

  then: actions([
    FileTracker.setVisibility,
    {
      owner: user,
      file,
      visible,
    },
  ]),
});

export const SetVisibilityResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/setVisibility" }, { request }],
    [FileTracker.setVisibility, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "set visibility" }]),
});

export const SetVisibilityError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/setVisibility" }, { request }],
    [FileTracker.setVisibility, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

//-- SYNCS FOR QUERIES --//

export const GetVisibilityRequest: Sync = (
  { request, session, user, file, isVisible },
) => ({
  when: actions([
    Requesting.request,
    { path: "/FileTracker/_getVisibility", session, file },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const sessionFrames = await frames.query(Sessioning._getUser, { session }, {
      user,
    });
    if (sessionFrames.length === 0) {
      return new Frames();
    }
    const userIdValue = sessionFrames[0][user];

    const result = await FileTracker._getVisibility({
      owner: userIdValue,
      file: originalFrame[file],
    });

    return await new Frames({
      ...originalFrame,
      [isVisible]: result.isVisible,
    });
  },
  then: actions([
    Requesting.respond,
    { request, isVisible },
  ]),
});

export const GetCurrentItemRequest: Sync = (
  { request, session, user, file, index },
) => ({
  when: actions([
    Requesting.request,
    { path: "/FileTracker/_getCurrentItem", session, file },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const sessionFrames = await frames.query(Sessioning._getUser, { session }, {
      user,
    });
    if (sessionFrames.length === 0) {
      return new Frames();
    }
    const userIdValue = sessionFrames[0][user];
    const result = await FileTracker._getCurrentItem({
      owner: userIdValue,
      file: originalFrame[file],
    });

    return new Frames({
      ...originalFrame,
      [index]: result.index,
    });
  },
  then: actions([
    Requesting.respond,
    { request, index },
  ]),
});
