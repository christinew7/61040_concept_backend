
# prompt: What do I need to add to my backend for the api routes and specs to work? how do i check where the api are? which link url
**Generate an API spec for your back end and start it up**. Using the `api-extraction` prompt, generate an API spec or your back end. Start the back end running by executing `deno task concepts` in the console. Note the URL that it reports the server is listening on (eg, `http://localhost:8000`).

# response:

Based on your prompt, the process isn't about *adding* new code for API routes and specs to your backend manually, but rather about **generating an API specification from your existing backend code** and then **starting that backend** to make the routes live.

Here's what you need to do, broken down to answer your questions:

---

### What do I need to add to my backend for the API routes and specs to work?

You don't need to *add* anything to your backend code for the routes themselves, as they are presumed to already exist within your application's logic. For the API *specs* to work, you need to **generate them using the provided tooling/prompt**.

1.  **API Routes:** Your backend code (e.g., in Deno, Node.js, Python, etc.) must already define the endpoints (e.g., `/users`, `/products/{id}`), the HTTP methods (GET, POST, PUT, DELETE), and the logic associated with those routes. The prompt implies this code is already in place.
2.  **API Specs:** These are *generated* from your existing backend code using the `api-extraction` prompt. You don't write the spec files by hand in this workflow.

---

### How do I check where the API are? Which link URL?

This involves two main steps: generating the spec (for documentation) and starting your backend (to make the API live).

#### **Step 1: Generate the API Specification (Documentation)**

*   **Action:** Use the `api-extraction` prompt.
*   **Purpose:** This will analyze your backend code and output a structured document (likely in OpenAPI/Swagger format) that details all your API endpoints, their methods, parameters, request/response bodies, authentication requirements, etc.
*   **How it helps:** This generated spec is your primary reference for *where* all your APIs are, what they do, and how to interact with them. It's like a map and instruction manual for your API. You'll read this spec to understand the various paths (e.g., `/api/v1/users`, `/api/v1/products`), the HTTP verbs (GET, POST), and what data each expects/returns.

#### **Step 2: Start Your Backend Running (Live API)**

*   **Action:** Execute `deno task concepts` in your console.
*   **Purpose:** This command will start your Deno backend server. Once running, your API endpoints become *accessible* over the network.
*   **Identifying the Link URL:** As the prompt states, when you run `deno task concepts`, your console output will include a line indicating **the URL the server is listening on**.
    *   **Example Output:** You'll see something like:
        ```
        Listening on http://localhost:8000
        ```
    *   **The Link URL:** This URL (e.g., `http://localhost:8000`) is your **base URL** for making requests to your API.
    *   **How to check API endpoints with this URL:**
        *   Once you have the base URL (e.g., `http://localhost:8000`), you'll combine it with the paths from your generated API spec.
        *   **For example:** If your API spec tells you there's a `GET /api/v1/users` endpoint, you would make a request to `http://localhost:8000/api/v1/users`.
        *   You can use tools like:
            *   **Web browser:** For `GET` requests directly (e.g., paste `http://localhost:8000/api/v1/users` into your browser).
            *   **`curl` (in your terminal):** `curl http://localhost:8000/api/v1/users`
            *   **Postman, Insomnia, or VS Code REST Client:** These tools are excellent for constructing and sending more complex API requests (POST, PUT, DELETE, with headers, body, etc.).

---

**In summary:**

1.  **Generate the API Spec** using the `api-extraction` prompt. This gives you the *documentation* of all your routes.
2.  **Start your backend** with `deno task concepts`.
3.  **Note the URL** that `deno` reports (e.g., `http://localhost:8000`). This is your **base URL**.
4.  Combine the base URL with the paths from your generated spec to interact with your live API.