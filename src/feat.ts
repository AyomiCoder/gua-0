#!/usr/bin/env ts-node

import https from 'https';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk'; // Theming support

// Constants
const CACHE_FILE = path.resolve(__dirname, 'cache.json');
const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes
const CONFIG_FILE = path.resolve(__dirname, '.ghactivityrc');

// Types
interface GitHubEvent {
    type: string;
    repo: { name: string };
    payload: { commits?: { message: string }[] };
    created_at: string;
}

interface UserDetails {
    name: string;
    bio: string;
    public_repos: number;
    followers: number;
    following: number;
}

interface Config {
    username?: string;
    limit?: number;
    exportFormat?: string;
    fromDate?: string;
    toDate?: string;
}

// Utility: Read cache
const readCache = (key: string): any => {
    if (fs.existsSync(CACHE_FILE)) {
        const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        const cachedData = cache[key];
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRATION) {
            return cachedData.data;
        }
    }
    return null;
};

// Utility: Write cache
const writeCache = (key: string, data: any): void => {
    let cache: Record<string, { data: any; timestamp: number }> = {};
    if (fs.existsSync(CACHE_FILE)) {
        cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
    cache[key] = { data, timestamp: Date.now() };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
};

// Utility: Fetch from API
const fetchFromAPI = (url: string): Promise<any> => {
    const options = { headers: { 'User-Agent': 'github-activity-cli' } };

    return new Promise((resolve, reject) => {
        https.get(url, options, (res) => {
            let data = '';
            if (res.statusCode === 200) {
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => resolve(JSON.parse(data)));
            } else {
                reject(new Error(`Request failed with status code ${res.statusCode}`));
            }
        }).on('error', (err) => reject(err));
    });
};

// Utility: Format time ago
const timeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
};

// Fetch user details
const fetchUserDetails = async (username: string): Promise<UserDetails> => {
    const url = `https://api.github.com/users/${username}`;
    const cached = readCache(`user-${username}`);
    if (cached) return cached;

    const userDetails = await fetchFromAPI(url);
    writeCache(`user-${username}`, userDetails);
    return userDetails as UserDetails;
};

// Export activities
const exportActivities = (activities: GitHubEvent[], format: string): void => {
    const filePath = path.resolve(__dirname, `activities.${format}`);
    let content = '';

    if (format === 'json') {
        content = JSON.stringify(activities, null, 2);
    } else if (format === 'csv') {
        const headers = 'Event Type, Repository, Details, Timestamp\n';
        const rows = activities.map(
            (event) =>
                `${event.type}, ${event.repo.name}, ${formatActivity(event)}, ${timeAgo(event.created_at)}`
        );
        content = headers + rows.join('\n');
    } else if (format === 'md') {
        content = activities
            .map(
                (event) =>
                    `- **${event.type}**: ${formatActivity(event)} in \`${event.repo.name}\` (${timeAgo(
                        event.created_at
                    )})`
            )
            .join('\n');
    }

    fs.writeFileSync(filePath, content);
    console.log(chalk.green(`Activities exported to ${filePath}`));
};

// Display user details
const displayUserDetails = (user: UserDetails): void => {
    console.log(chalk.blue(`\n👤 User Details:`));
    console.log(`- Name: ${user.name || 'N/A'}`);
    console.log(`- Bio: ${user.bio || 'N/A'}`);
    console.log(`- Public Repos: ${user.public_repos}`);
    console.log(`- Followers: ${user.followers}`);
    console.log(`- Following: ${user.following}`);
};

// Display activities
const displayActivities = (activities: GitHubEvent[]): void => {
    console.log(chalk.yellow(`\nRecent Activity:\n`));
    activities.forEach((event) => {
        console.log(`- ${formatActivity(event)} (${timeAgo(event.created_at)})`);
    });
};

// Format activity with emojis
const formatActivity = (event: GitHubEvent): string => {
    switch (event.type) {
        case 'PushEvent':
            return `🚀 Pushed ${event.payload.commits?.length || 0} commits`;
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
    };
};

// Utility: Load Config
const loadConfig = (): Config => {
    if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
    return {};
};

// Utility: Save Config
const saveConfig = (config: Config): void => {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(chalk.green(`Configuration saved to ${CONFIG_FILE}`));
};

// Utility: Prompt User Input
const prompt = (question: string): Promise<string> => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(chalk.cyan(question), (answer) => {
        rl.close();
        resolve(answer);
    }));
};

// Main function
const main = async (): Promise<void> => {
    let config = loadConfig();

    // Interactive Mode if CLI arguments are missing
    const username = config.username || (await prompt('Enter GitHub username: '));
    const limit = config.limit || parseInt((await prompt('Enter the number of events to fetch (default: 30): ')) || '30', 10);
    const exportFormat = config.exportFormat || (await prompt('Enter export format (json/csv/md): ')) || 'json';
    const fromDate = config.fromDate || (await prompt('Enter start date (YYYY-MM-DD) or leave blank: '));
    const toDate = config.toDate || (await prompt('Enter end date (YYYY-MM-DD) or leave blank: '));

    // Update Config
    config = { username, limit, exportFormat, fromDate, toDate };
    saveConfig(config);

    try {
        console.log(chalk.cyan(`Fetching data for "${username}"...`));
        const user = await fetchUserDetails(username);
        displayUserDetails(user);

        const activities = await fetchFromAPI(`https://api.github.com/users/${username}/events`);
        const filteredActivities = activities.filter((activity: GitHubEvent) => {
            const createdAt = new Date(activity.created_at).getTime();
            const from = fromDate ? new Date(fromDate).getTime() : null;
            const to = toDate ? new Date(toDate).getTime() : null;

            return (!from || createdAt >= from) && (!to || createdAt <= to);
        });

        displayActivities(filteredActivities);

        if (exportFormat) {
            exportActivities(filteredActivities, exportFormat);
        }
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('404')) {
                console.error(chalk.red(`Error: The username "${username}" does not exist on GitHub.`));
            } else if (error.message.includes('ENOTFOUND')) {
                console.error(chalk.red('Error: Unable to connect to GitHub. Please check your internet connection.'));
            } else {
                console.error(chalk.red('Error:'), error.message);
            }
        } else {
            console.error(chalk.red('An unknown error occurred.'));
        }
    }
};

main();
