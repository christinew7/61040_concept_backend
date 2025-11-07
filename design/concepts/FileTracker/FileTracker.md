# prompt:
# Concept: FileTracker

*   **concept**: FileTracker \[User, File]
*   **purpose**: track current position and enable navigation within files
*   **principle**: a user can start tracking their file from the first listed item (which might not be the first item); a user can also use an LLM to start tracking their file at a better suited item within the file; they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed
*   **state**
    *   a set of `TrackedFiles` with
	    * an `owner` User
        *   a `file` `File`
        *   a `currentIndex` `Number`
        *   a `maxIndex` `Number`
        *   a `isVisible` `Flag`
*   **actions**
    *   `startTracking (owner: User, file: File, maxIndex: number)`
        *   **requires** this `owner` exists, this `file` exists, this maxIndex is a nonnegative integer, this `owner` and this `file` isn't already in the set of `TrackedFiles`
        *   **effects** create a new `TrackedFile` with this owner, this file and this maxIndex, `currentIndex` is initialized to 0,, `isVisible` set to true
    * `startTrackingUsingLLM(owner: User, file: File, fileInput: string, fileMaxIndex: number)`
	    * **requires** this `owner` exists, this `file` exists, this `owner` and this `file` isn't already in the set of `TrackedFiles`, this fileInput is in JSON format
	    * **effect** uses this `llm` to determine a more accurate `startIndex` for the file
    *   `deleteTracking (owner: User, file: File)`
        *   **requires** this `owner` and this `file` is in the set of TrackedFiles
        *   **effects** delete the `TrackedFile` with this `owner` and this `file`
    *   `jumpTo (owner: User, file: File, index: Number)`
        *   **requires** this `owner` and this `file` exists in the TrackedFiles, this `index` is a valid index between 0 and the `maxIndex`
        *   **effects** updates the `currentIndex` of the TrackedFile with this `owner` and this `file` to this `index`
    *   `next (owner: User, file: File)`
        *   **requires** this `owner` and this `file` exists in the TrackedFiles, the `currentIndex` of this TrackedFile is less than the `maxIndex`
        *   **effects** increments the TrackedFile with this owner and this file by 1
    *  ` back (owner: User, file: File)File)``
        *   **requires** this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is greater than 0
        *   **effects** decrements the TrackedFile with this owner and this file by 1
    *   `setVisibility (owner: User, file: File, visible: Flag)`
        *   **requires** this owner and this file exists in the TrackedFiles
        *   **effects** in the TrackedFile with this owner and this file, set isVisible to this visible
* **queries**
	*  `_getCurrentItem (owner: User, file: File): (index: Number)`
	    * **requires** this owner and this file exists in the TrackedFiles
        *   **effects** in the TrackedFile with this owner and this file, return the currentIndex
    * `_getVisibility (owner: User, file: File): (isVisible: boolean)`
	    * **requires** this owner and this file exists in the TrackedFiles
        *   **effects** in the TrackedFile with this owner and this file, return `isVisible`