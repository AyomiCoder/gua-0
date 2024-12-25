#!/usr/bin/env ts-node

import https from 'https';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.resolve(__dirname, 'cache.json');
const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

// Utility functions for caching
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

// Fetch data with retry logic
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

// Fetch user details
const fetchUserDetails = (username: string): Promise<any> => {
    const url = `https://api.github.com/users/${username}`;
    const options = { headers: { 'User-Agent': 'github-activity-cli' } };
    return fetchWithRetry(url, options).then((data) => JSON.parse(data));
};

// Fetch user activity
const fetchActivity = (
    username: string,
    filterType?: string,
    sortOption?: string,
    exportFormat?: string
): void => {
    const cachedData = readCache(username);
    if (cachedData) {
        console.log('Using cached data...');
        displayActivities(cachedData, filterType, sortOption, exportFormat);
        return;
    }

    const url = `https://api.github.com/users/${username}/events/public`;
    const options = { headers: { 'User-Agent': 'github-activity-cli' } };

    fetchWithRetry(url, options)
        .then((data) => {
            const activities = JSON.parse(data);
            writeCache(username, activities); // Cache data
            displayActivities(activities, filterType, sortOption, exportFormat);
        })
        .catch((err) => console.error(`Error: ${err.message}`));
};

// Display activities
const displayActivities = (
    activities: any[],
    filterType?: string,
    sortOption?: string,
    exportFormat?: string
): void => {
    let filteredActivities = filterType
        ? activities.filter((activity) => activity.type === filterType)
        : activities;

    // Sort activities
    if (sortOption === 'date') {
        filteredActivities = filteredActivities.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    } else if (sortOption === 'type') {
        filteredActivities = filteredActivities.sort((a, b) => a.type.localeCompare(b.type));
    }

    // Display in table format
    console.log(`\nRecent Activity:\n`);
    console.log(`| Event Type           | Repository             | Details`);
    console.log(`|----------------------|------------------------|------------------------`);
    filteredActivities.slice(0, 5).forEach((event) => {
        const eventRow = `| ${event.type.padEnd(20)} | ${event.repo.name.padEnd(22)} | ${formatActivity(event)}`;
        console.log(eventRow);
    });

    // Export to file if required
    if (exportFormat === 'json') {
        fs.writeFileSync('activity.json', JSON.stringify(filteredActivities, null, 2));
        console.log('\nExported activity to activity.json');
    } else if (exportFormat === 'csv') {
        const csvData = filteredActivities
            .map((event) => `${event.type},${event.repo.name},${formatActivity(event)}`)
            .join('\n');
        fs.writeFileSync('activity.csv', csvData);
        console.log('\nExported activity to activity.csv');
    }
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


// Main function
const main = async () => {
    const args = process.argv.slice(2);
    const username = args[0];
    const filterType = args.find((arg) => arg.startsWith('--filter='))?.split('=')[1];
    const sortOption = args.find((arg) => arg.startsWith('--sort='))?.split('=')[1];
    const exportFormat = args.find((arg) => arg.startsWith('--export='))?.split('=')[1];

    if (!username) {
        console.error('Error: Please provide a GitHub username.');
        process.exit(1);
    }

    const userDetails = await fetchUserDetails(username);
    console.log(`\nGitHub User Details:\n`);
    console.log(`Name: ${userDetails.name || 'N/A'}`);
    console.log(`Bio: ${userDetails.bio || 'N/A'}`);
    console.log(`Public Repositories: ${userDetails.public_repos || 0}\n`);

    fetchActivity(username, filterType, sortOption, exportFormat);
};

main();
