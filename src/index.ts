#!/usr/bin/env ts-node

import https from 'https';

const fetchActivity = (username: string): void => {
    const url = `https://api.github.com/users/${username}/events/public`;
    const options = {
        headers: {
            'User-Agent': 'github-activity-cli',
        },
    };

    https.get(url, options, (res) => {
        let data = '';

        if (res.statusCode !== 200) {
            console.error(`Error: Failed to fetch activity for "${username}".`);
            res.resume();
            return;
        }

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const activities = JSON.parse(data);
                if (activities.length === 0) {
                    console.log(`No public activity found for "${username}".`);
                } else {
                   activities.slice(0, 5).forEach((activity: any) => {
                    console.log(formatActivity(activity));
                   });
                }
            } catch (error) {
                console.error(`Error: Failed to parse activity for "${username}".`);
            }
        });
    }).on('error', (err) => {
        console.error(`Error: ${err.message}`);
    });
};

const formatActivity = (event: any): string => {
    switch (event.type) {
      case 'PushEvent':
        return `🚀 Pushed ${event.payload.commits.length} commits to ${event.repo.name}`;
      case 'IssuesEvent':
        return `🐛 Opened a new issue in ${event.repo.name}`;
      case 'WatchEvent':
        return `⭐ Starred ${event.repo.name}`;
      case 'PullRequestEvent':
        return `🔀 Created a pull request in ${event.repo.name}`;
      case 'PullRequestReviewEvent':
        return `📝 Reviewed a pull request in ${event.repo.name}`;
      case 'ForkEvent':
        return `🍴 Forked ${event.repo.name}`;
      case 'IssueCommentEvent':
        return `💬 Commented on an issue in ${event.repo.name}`;
      default:
        return `📌 Performed ${event.type} on ${event.repo.name}`;
    }
  };
  
  const main = () => {
    const username = process.argv[2];
    if (!username) {
        console.error('Error: Please provide a github username.');
        process.exit(1);
    }
    fetchActivity(username);
  };

  main();