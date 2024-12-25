

# gua-0: GitHub Activity CLI

`gua-0` is a simple command-line interface (CLI) tool that fetches the recent activity of a GitHub user and displays it directly in the terminal. It allows you to interact with GitHub's event API, filter and sort activities, and export the results in multiple formats.

## Installation & Setup

### Step 1: Clone the Repository
Clone the repository to your local machine.

```bash
git clone https://github.com/yourusername/gua-0.git
cd gua-0
```

### Step 2: Install Dependencies
To use the `gua-0` tool, you will need Node.js installed. You can then install the required dependencies by running:

```bash
npm install
```

### Step 3: Run the CLI
Run the following command to fetch the recent activity for a GitHub user:

```bash
npx ts-node src/index.ts <Github Username>
```

Replace `<Github Username>` with the actual GitHub username whose activities you want to track.

### Step 4: Filter by Event Type
You can filter the results by event type (e.g., PushEvent, IssuesEvent, etc.):

```bash
npx ts-node src/index.ts <Github Username> --filter=PushEvent
```

### Available GitHub Event Types:
1. **PushEvent**: Triggered when commits are pushed to a repository.
2. **IssuesEvent**: Triggered when an issue is opened, edited, closed, or reopened.
3. **PullRequestEvent**: Triggered when a pull request is opened, closed, or merged.
4. **PullRequestReviewEvent**: Triggered when a pull request review is submitted.
5. **PullRequestReviewCommentEvent**: Triggered when a comment is added to a pull request review.
6. **WatchEvent**: Triggered when a repository is starred.
7. **ForkEvent**: Triggered when a repository is forked.
8. **IssueCommentEvent**: Triggered when a comment is added to an issue.
9. **CreateEvent**: Triggered when a repository, branch, or tag is created.
10. **DeleteEvent**: Triggered when a branch or tag is deleted.
11. **ReleaseEvent**: Triggered when a release is published.
12. **PublicEvent**: Triggered when a private repository is made public.
13. **MemberEvent**: Triggered when a user is added to a repository as a collaborator.

---

## Newly Added Features

### 1. **Sort Activities by Date or Type**
You can now sort the fetched activities either by **date** or **type**. 

**Sort by date**:
```bash
npx ts-node src/index.ts <Github Username> --sort=date
```

**Sort by type**:
```bash
npx ts-node src/index.ts <Github Username> --sort=type
```

### 2. **Export Activity to Different Formats**
You can export the fetched activities in multiple formats: **JSON**, **CSV**, and **Markdown**.

**Export as JSON**:
```bash
npx ts-node src/index.ts <Github Username> --export=json
```

**Export as CSV**:
```bash
npx ts-node src/index.ts <Github Username> --export=csv
```

**Export as Markdown**:
```bash
npx ts-node src/index.ts <Github Username> --export=md
```

### 3. **Display Structured Data About the User**
The CLI now displays more detailed and structured information about the user, such as:
- Name
- Bio
- Public repositories count
- Followers
- Following

### 4. **Customize the Number of Events to Fetch**
You can customize the number of activities you want to retrieve by using the `--limit` flag:

```bash
npx ts-node src/index.ts <Github Username> --limit=10
```
This will fetch the 10 most recent activities for the user.

### 5. **Pagination (Fetch Additional Pages)**
You can fetch additional pages of activities using the `--page` flag:

```bash
npx ts-node src/index.ts <Github Username> --page=2
```
This will fetch the activities from the second page.

### 6. **Filter Activities by Date Range**
Use the `--from` and `--to` flags to specify a date range for filtering activities:

```bash
npx ts-node src/index.ts <Github Username> --from=2024-01-01 --to=2024-12-31
```
This will fetch activities within the specified date range (e.g., from January 1, 2024 to December 31, 2024).

---

## CLI Argument Reference

| Argument        | Description                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| `--filter=<type>` | Filter activities by event type (e.g., PushEvent, PullRequestEvent).       |
| `--sort=<field>`  | Sort activities by field (`date` or `type`).                               |
| `--export=<format>`| Export activities in `json`, `csv`, or `md` (Markdown) format.             |
| `--limit=<number>` | Limit the number of activities fetched (e.g., `--limit=10`).               |
| `--page=<number>`  | Fetch activities from a specific page (for pagination).                    |
| `--from=<date>`    | Filter activities starting from a specific date (e.g., `2024-01-01`).      |
| `--to=<date>`      | Filter activities until a specific date (e.g., `2024-12-31`).              |

---

## Example Usage

1. Fetch the most recent activities for a GitHub user:
   ```bash
   npx ts-node src/index.ts octocat
   ```

2. Filter activities by a specific event type (e.g., PushEvent):
   ```bash
   npx ts-node src/index.ts octocat --filter=PushEvent
   ```

3. Sort activities by date:
   ```bash
   npx ts-node src/index.ts octocat --sort=date
   ```

4. Export activities in CSV format:
   ```bash
   npx ts-node src/index.ts octocat --export=csv
   ```

5. Limit the number of fetched activities to 5:
   ```bash
   npx ts-node src/index.ts octocat --limit=5
   ```

6. Fetch activities from a specific date range:
   ```bash
   npx ts-node src/index.ts octocat --from=2024-01-01 --to=2024-12-31
   ```

7. Fetch activities from the second page:
   ```bash
   npx ts-node src/index.ts octocat --page=2
   ```

---

## Contributing

Feel free to fork the repository and submit pull requests. All contributions are welcome!
