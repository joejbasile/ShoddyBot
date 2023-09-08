import DiscordJS, { IntentsBitField } from 'discord.js'
import dotenv from 'dotenv'
dotenv.config()

let createMessageState: boolean = true;

const client = new DiscordJS.Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

client.login(process.env.TOKEN);

client.on('ready', () => {
    console.log('Logged in as ShoddyBot!');
})

client.on('messageCreate', async (message) => {
    let lastMessages = await message.channel.messages.fetch({ limit: 2 });
    // this is the last message sent before this command
    let previousMessage = lastMessages.last();
    if(message.author.bot === false && createMessageState === true && message.content === 'bump'.toLocaleLowerCase()) {
        createMessageState = false;
        processMessage(previousMessage);
    }
  })

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

async function processMessage(message: any) {
    let userMessageWordsList: Array<string> = message.content.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(' ');
    let returnMessage: Array<string> = [];
    for (let originalMessageWordIndex: number = 0; originalMessageWordIndex < userMessageWordsList.length; originalMessageWordIndex++) {
        const originalMessageElementAtIndex = userMessageWordsList[originalMessageWordIndex];
        let apiString: string = `https://api.dictionaryapi.dev/api/v2/entries/en/${originalMessageElementAtIndex}`;
        let apiResponse: any = await fetch(apiString);
        let data: any = null;
        if(apiResponse.status === 200) {
            data = await apiResponse.json();    
        }
        let lengthOfBuiltMessage: number = -1;
        if(data != null && data.length !== 0) {
            let dataIterator: number = 0;
            let maxDataIterator: number = 0;
            if(data.length >= 2) {
                maxDataIterator = 1;
            }
            for (; dataIterator <= maxDataIterator; dataIterator++) {
                if(lengthOfBuiltMessage < returnMessage.length) {
                    let word: any = data[dataIterator];
                    try {
                        if(word['word'] != undefined && word['word'] === originalMessageElementAtIndex.toLowerCase()) {
                            if(word['meanings'] != undefined || word['meanings'].length !== 0) {
                                for (const key in word['meanings']) {
                                    if (Object.prototype.hasOwnProperty.call(word['meanings'], key)) {
                                        let synonymsOfWord: Array<string> = word['meanings'][key]['synonyms'];
                                        if(synonymsOfWord == undefined || synonymsOfWord.length === 0) {
                                            returnMessage[originalMessageWordIndex] = originalMessageElementAtIndex;
                                            lengthOfBuiltMessage++;
                                            break;
                                        } else {
                                            let randomSynonymIndex: number = getRandomInt(synonymsOfWord.length);
                                            if(synonymsOfWord[randomSynonymIndex] != undefined && synonymsOfWord[randomSynonymIndex] !== '') {
                                                let synonym: string = synonymsOfWord[randomSynonymIndex];
                                                if (synonym != undefined || synonym !== '') {
                                                    returnMessage[originalMessageWordIndex] = synonym;
                                                    lengthOfBuiltMessage++;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        returnMessage[originalMessageWordIndex] = originalMessageElementAtIndex;
                        lengthOfBuiltMessage++;
                        break;
                    }
                }
            }
        } else {
            returnMessage[originalMessageWordIndex] = originalMessageElementAtIndex;
            lengthOfBuiltMessage++;
        }
    }
    let returnString: string = '';
    returnString = returnMessage.join(' ').toString();
    if(returnString !== '') {
        message.channel.send('Sounds like ' + message.author.username + ' is having some trouble with their words. I will translate. This is what they\'re really trying to say: \n\t' + returnString);
    }
    createMessageState = true;
}

