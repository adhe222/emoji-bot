const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk');  // Add chalk for styling

// Global Variables
const refererId = 5533258750; // Static refererId
const userAgentFile = 'user-agent-phone.txt'; // Path to the User-Agent file

// Read queryIds from hash.txt, trim whitespaces, and ensure one per line
const queryIds = fs.readFileSync('hash.txt', 'utf-8')
  .split('\n') // Split the text into lines
  .map(line => line.trim()) // Trim whitespaces from each line
  .filter(Boolean); // Remove empty lines

// Read and randomize User-Agent from the file
const userAgents = fs.readFileSync(userAgentFile, 'utf-8')
  .split('\n')  // Split by new lines
  .map(agent => agent.trim()) // Trim spaces
  .filter(Boolean); // Remove empty lines

// Helper to randomize the game type
const getRandomGame = () => {
  const games = ['Darts', 'Football', 'Basketball'];
  return games[Math.floor(Math.random() * games.length)];
};

// Delay function to add a wait time
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Axios instance template (will be customized per queryId)
const createAxiosInstance = (userAgent) => {
  return axios.create({
    headers: {
      'User-Agent': userAgent, // Bind the random User-Agent to this session
    }
  });
};

// Login function (no function calling another function)
const login = async (queryId) => {
  // Randomly select a User-Agent for this queryId (account)
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

  // Create a new axios instance with the selected User-Agent for this account
  const axiosInstance = createAxiosInstance(randomUserAgent);

  try {
    const response = await axiosInstance.post('https://emojiapp.xyz/api/auth', {
      initData: queryId,
      refererId: refererId
    });

    const user = response.data.user;
    const token = response.data.token;
    
    console.log(chalk.green(`Logged in as ${user.username} (${user.nameSurname})`));
    console.log(chalk.yellow(`    Points: ${user.points}, Tickets: ${user.amountOfTickets}`));
    
    return { token, amountOfTickets: user.amountOfTickets, axiosInstance };
    
  } catch (error) {
    console.error(chalk.red('Login failed for queryId:', queryId, error.response?.data || error.message));
    return null;
  }
};

// Check if free ticket can be claimed
const checkFreeTicket = async (token, axiosInstance) => {
  try {
    const response = await axiosInstance.post('https://emojiapp.xyz/api/users/free-tickets-eligibility', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.canClaim) {
      console.log(chalk.blue('    Free ticket available to claim'));
      await claimFreeTicket(token, axiosInstance);
    } else {
      console.log(chalk.blue('    Cannot claim free ticket at the moment.'));
    }

  } catch (error) {
    console.error(chalk.red('Error checking free ticket:', error.response?.data || error.message));
  }
};

// Claim free ticket
const claimFreeTicket = async (token, axiosInstance) => {
  try {
    const response = await axiosInstance.post('https://emojiapp.xyz/api/users/claim-free-tickets', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.success) {
      console.log(chalk.green('    Tickets claimed successfully!'));
    }
  } catch (error) {
    console.error(chalk.red('Error claiming free ticket:', error.response?.data || error.message));
  }
};

// Fetch available quests and filter out completed quests and 'PAYMENT' option
const fetchQuests = async (token, axiosInstance) => {
  try {
    const response = await axiosInstance.get('https://emojiapp.xyz/api/quests', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const quests = response.data.quests;

    // Filter quests: Exclude completed quests and quests with option 'PAYMENT'
    const availableQuests = {
      daily: quests.daily.filter(q => !q.completed && q.option !== 'PAYMENT'),
      oneTime: quests.oneTime.filter(q => !q.completed && q.option !== 'PAYMENT'),
      special: quests.special.filter(q => !q.completed && q.option !== 'PAYMENT'),
    };

    console.log(chalk.cyan('    Available quests:', availableQuests));
    return availableQuests;

  } catch (error) {
    console.error(chalk.red('Error fetching quests:', error.response?.data || error.message));
  }
};

// Claim a specific quest
const claimQuest = async (token, questId, axiosInstance) => {
  try {
    const response = await axiosInstance.get(`https://emojiapp.xyz/api/quests/verify?questId=${questId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.message === "Quest completed and reward granted") {
      const user = response.data.user;
      console.log(chalk.green(`    Quest completed. New ticket count: ${user.amountOfTickets}`));
	   await delay(3000);
    }

  } catch (error) {
    console.error(chalk.red('Error claiming quest:', error.response?.data || error.message));
  }
};

// Play games function until all tickets are used
const playGames = async (token, amountOfTickets, axiosInstance) => {
  try {
    if (amountOfTickets === 0) {
      console.log(chalk.magenta("    No game to play. Tickets are 0."));
      return; // Skip the game loop if there are no tickets
    }

    let gameIndex = 1; // Game counter for each account
    
    for (let i = 0; i < amountOfTickets; i++) {
      const gameName = getRandomGame();
      console.log(chalk.green(`    Game ${gameIndex}: Playing game: ${gameName}`));
      
      const response = await axiosInstance.post('https://emojiapp.xyz/api/play', {
        gameName: gameName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        const { pointsWon, message } = response.data;
        console.log(chalk.blue(`    ${message}`));  // Print the success message
        console.log(chalk.yellow(`    Points won: ${pointsWon}`));  // Print pointsWon from the response
      } else {
        console.log(chalk.red(`    Failed to play game ${gameName}`));
      }

      // Increment the game index for each game played
      gameIndex++;
      await delay(3000); // Delay for 3 seconds
    }
  } catch (error) {
    console.error(chalk.red('    Error while playing games:', error.response?.data || error.message));
  }
};

function printHeader() {
  const line = "=".repeat(50);
  const title = "Auto Play Emoji";
  const createdBy = "Bot created by: https://t.me/airdropwithmeh";

  const totalWidth = 50;
  const titlePadding = Math.floor((totalWidth - title.length) / 2);
  const createdByPadding = Math.floor((totalWidth - createdBy.length) / 2);

  const centeredTitle = title.padStart(titlePadding + title.length).padEnd(totalWidth);
  const centeredCreatedBy = createdBy.padStart(createdByPadding + createdBy.length).padEnd(totalWidth);

  console.log(chalk.cyan.bold(line));
  console.log(chalk.cyan.bold(centeredTitle));
  console.log(chalk.green(centeredCreatedBy));
  console.log(chalk.cyan.bold(line));
}

// Main function to handle multiple accounts
const main = async () => {
	printHeader();
  let accountIndex = 1;  // Start the account index

  for (const queryId of queryIds) {
    console.log(chalk.bold.yellow('\n=============================='));
    console.log(chalk.bold.green(`    Processing Account #${accountIndex}`)); // Add account index

    const loginResult = await login(queryId);
    if (!loginResult) {
      accountIndex++; // Increment account index before continuing
      continue; // Skip if login failed for this queryId
    }
    
    const { token, amountOfTickets, axiosInstance } = loginResult;
    
    // Check if free ticket can be claimed
    await checkFreeTicket(token, axiosInstance);

    // Fetch available quests and claim uncompleted ones (excluding 'PAYMENT' option)
    const availableQuests = await fetchQuests(token, axiosInstance);

    // Claim daily, one-time, and special quests
    for (const quest of availableQuests.daily) {
      await claimQuest(token, quest.id, axiosInstance);
    }
    for (const quest of availableQuests.oneTime) {
      await claimQuest(token, quest.id, axiosInstance);
    }
    for (const quest of availableQuests.special) {
      await claimQuest(token, quest.id, axiosInstance);
    }



    // Play games only if there are tickets available
    await playGames(token, amountOfTickets, axiosInstance);

    // Add a separator between accounts processed
    console.log(chalk.bold.yellow('    =============================='));
    console.log(chalk.bold.green('    Account processing completed.'));
    console.log(chalk.bold.yellow('    ===============================\n'));

    accountIndex++;  // Increment account index for the next account
  }

  // After all accounts have been processed, delay for 4 hours (14400 seconds)
  console.log(chalk.cyan("    All accounts processed. Waiting for 4 hours before starting next round..."));
  await delay(14400000); // Delay for 4 hours (4 * 60 * 60 * 1000 ms)
  console.log(chalk.cyan("    4 hours have passed. Restarting process..."));

  // Re-run the main function (if needed) or finish
  main();
};

// Start the process
main();
