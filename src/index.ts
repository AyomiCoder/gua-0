#!/usr/bin/env ts-node

import https from 'https';
import fs from 'fs';
import path from 'path';

// Constants for cache
const CACHE_FILE = path.resolve(__dirname, 'cache.json');
const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

// Utility function to format timestamps
const timeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
};

// Utility function for caching
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

const writeCache = (username: string, data: any): void => {
    let cache: { [key: string]: { data: any; timestamp: number } } = {};
    if (fs.existsSync(CACHE_FILE)) {
        cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
    cache[username] = { data, timestamp: Date.now() };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
};

// Fetch data with pagination and retry logic
const fetchWithPagination = (
    username: string,
    page: number = 1,
    limit: number = 30,
    retries: number = 3,
    delay: number = 5000
): Promise<any[]> => {
    const url = `https://api.github.com/users/${username}/events/public?page=${page}&per_page=${limit}`;
    const options = { headers: { 'User-Agent': 'github-activity-cli' } };

    return new Promise((resolve, reject) => {
        const attempt = (retriesLeft: number) => {
            https.get(url, options, (res) => {
                if (res.statusCode === 403 && retriesLeft > 0) {
                    console.log(`Rate limit exceeded. Retrying in ${delay / 1000} seconds...`);
                    setTimeout(() => attempt(retriesLeft - 1), delay);
                } else if (res.statusCode === 200) {
                    let data = '';
                    res.on('data', (chunk) => (data += chunk));
                    res.on('end', () => resolve(JSON.parse(data)));
                } else {
                    reject(new Error(`Request failed with status code ${res.statusCode}`));
                }
            }).on('error', (err) => reject(err));
        };

        attempt(retries);
    });
};

// Display activities
const displayActivities = (
    activities: any[],
    limit: number,
    page: number
): void => {
    console.log(`\nRecent Activity (Page ${page}):\n`);
    console.log(`| Event Type           | Repository             | Details                          | Timestamp`);
    console.log(`|----------------------|------------------------|----------------------------------|----------------`);

    activities.slice(0, limit).forEach((event) => {
        const row = `| ${event.type.padEnd(20)} | ${event.repo.name.padEnd(22)} | ${formatActivity(event).padEnd(32)} | ${timeAgo(event.created_at)}`;
        console.log(row);
    });
};

// Format activity with emojis
const formatActivity = (event: any): string => {
    switch (event.type) {
        case 'PushEvent':
            return `🚀 Pushed ${event.payload.commits.length} commits`;
        case 'IssuesEvent':
            return `🐛 Opened an issue`;
        case 'WatchEvent':
            return `⭐ Starred`;
        case 'PullRequestEvent':
            return `🔀 Created a pull request`;
        case 'ForkEvent':
            return `🍴 Forked`;
        case 'IssueCommentEvent':
            return `💬 Commented on an issue`;
        default:
            return `📌 Performed ${event.type}`;
    }
};

// Main function
const main = async () => {
    const args = process.argv.slice(2);
    const username = args[0];
    const page = parseInt(args.find((arg) => arg.startsWith('--page='))?.split('=')[1] || '1', 10);
    const limit = parseInt(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || '30', 10);

    if (!username) {
        console.error('Error: Please provide a GitHub username.');
        process.exit(1);
    }

    console.log(`Fetching recent activity for "${username}"...`);
    const activities = await fetchWithPagination(username, page, limit);
    if (activities.length === 0) {
        console.log(`No public activity found for "${username}".`);
    } else {
        displayActivities(activities, limit, page);
    }
};

main();
