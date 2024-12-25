# gua-0
A simple command line interface (CLI) that fetches the recent activity of a GitHub user and display it in the terminal. 

1. Clone this repo
2. Run  `npx ts-node src/index.ts <Github Username>`
3. Run  `npx ts-node src/index.ts <Github Username> --filter=PushEvent` to filter by event type

# Other GitHub Event Types:
1. PushEvent - Triggered when commits are pushed to a repository.
2. IssuesEvent - Triggered when an issue is opened, edited, closed, or reopened.
3. PullRequestEvent - Triggered when a pull request is opened, closed, or merged.
4. PullRequestReviewEvent - Triggered when a pull request review is submitted.
5. PullRequestReviewCommentEvent - Triggered when a comment is added to a pull request review.
6. WatchEvent - Triggered when a repository is starred.
7. ForkEvent - Triggered when a repository is forked.
8. IssueCommentEvent - Triggered when a comment is added to an issue.
9. CreateEvent - Triggered when a repository, branch, or tag is created.
10. DeleteEvent - Triggered when a branch or tag is deleted.
11. ReleaseEvent - Triggered when a release is published.
12. PublicEvent - Triggered when a private repository is made public.
13. MemberEvent - Triggered when a user is added to a repository as a collaborator

# Newly Added Features
1. You can now sort the activity by date or type
    `npx ts-node src/index.ts <Github Username> --sort=date`
   `npx ts-node src/index.ts <Github Username> --sort=type`
2. You can export activity in two file formats.
    `npx ts-node src/index.ts <Github Username> --export=json`
    `npx ts-node src/index.ts <Github Username> --export=csv`
    `npx ts-node src/index.ts <Github Username> --export=md`
3. It now displays structured data and more info about the user.
4. Customize Number of Events:
    `npx ts-node src/index.ts <Github Username> --limit=10`
5. Pagination (Fetch Additional Pages):
    `npx ts-node src/index.ts <Github Username> --page=2`
6. `npx ts-node src/index.ts <Github Username> --from=2024-01-01 --to=2024-12-31`

