#!/usr/bin/env ts-node

import https from 'https';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.resolve(__dirname, 'cache.json');
const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

// Read cache from file
const readCache = (username: string): any => {
    if (fs.existsSync(CACHE_FILE)) {
        const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        const cachedData = cache[username];
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRATION) {
            return cachedData.data;
        }
    }
    return null;
};

// Write data to cache
const writeCache = (username: string, data: any): void => {
    let cache: { [key: string]: { data: any; timestamp: number } } = {};
    if (fs.existsSync(CACHE_FILE)) {
        cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
    cache[username] = { data, timestamp: Date.now() };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
};

// Retry logic for rate-limiting
const fetchWithRetry = (
    url: string,
    options: any,
    retries: number = 3,
    delay: number = 5000
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const attempt = (retriesLeft: number) => {
            https.get(url, options, (res) => {
                if (res.statusCode === 403 && retriesLeft > 0) {
                    console.log(`Rate limit exceeded. Retrying in ${delay / 1000} seconds...`);
                    setTimeout(() => attempt(retriesLeft - 1), delay);
                } else if (res.statusCode === 200) {
                    let data = '';
                    res.on('data', (chunk) => (data += chunk));
                    res.on('end', () => resolve(data));
                } else {
                    reject(new Error(`Request failed with status code ${res.statusCode}`));
                }
            }).on('error', (err) => reject(err));
        };

        attempt(retries);
    });
};

// Fetch user activity with caching and retry logic
const fetchActivity = (username: string, filterType?: string): void => {
    const cachedData = readCache(username);
    if (cachedData) {
        console.log('Using cached data...');
        displayActivities(cachedData, filterType);
        return;
    }

    const url = `https://api.github.com/users/${username}/events/public`;
    const options = {
        headers: {
            'User-Agent': 'github-activity-cli',
        },
    };

    fetchWithRetry(url, options)
        .then((data) => {
            const activities = JSON.parse(data);
            writeCache(username, activities); // Save to cache
            displayActivities(activities, filterType);
        })
        .catch((err) => {
            console.error(`Error: ${err.message}`);
        });
};

// Display activities with optional filtering
const displayActivities = (activities: any[], filterType?: string): void => {
    const filteredActivities = filterType
        ? activities.filter((activity) => activity.type === filterType)
        : activities;

    if (filteredActivities.length === 0) {
        console.log(
            `No recent activity${filterType ? ` for event type "${filterType}"` : ''} found.`
        );
    } else {
        filteredActivities.slice(0, 5).forEach((activity) => {
            console.log(formatActivity(activity));
        });
    }
};

// Format activity for display
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

// Main function
const main = () => {
    const args = process.argv.slice(2);
    const username = args[0];
    const filterType = args.find((arg) => arg.startsWith('--filter='))?.split('=')[1];

    if (!username) {
        console.error('Error: Please provide a GitHub username.');
        process.exit(1);
    }

    fetchActivity(username, filterType);
};

main();
