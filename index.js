const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const bodyParser = require("body-parser");
const features = require("./features");
const app = express();
app.use(bodyParser.json());
const readline = require("readline");

app.post("/list-features", async (req, res) => {
    console.log(
        req.body.questionnaire.map((item) => {
            return { Q: item.Q, A: item.A };
        })
    );
    const prompt = `given  the following array of features  delimited by <txt></txt> , and the following questionnaire in the following format [{"Q": "question", "A", "user's answer}] delimited by <p></p>, return a list of features names from our the list provided only based on the answers provided\n
        <txt>${features}</txt>\n
        <p>
        [
        ${req.body.questionnaire.map((item) => {
            return `{Q: ${item.Q}, A: ${item.A}}`;
        })}
        ] </p>\n
        if there is any unrelated answer skip it and if feature needed is not included in the provided features list ignore it and if there is no features mapped at all return "THERE IS NO FEATURES FOUND"
      `;
    console.log("prompt", prompt);

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0,
    });
    console.log(completion.data.choices[0].text);
    console.log(completion.data);
    res.send("Successful response." + completion.data.choices[0].text);
});

app.post("/chat", async (req, res) => {
    const userInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    userInterface.prompt();
    let context = [
        {
            role: "user",
            content: `you are a friendly chatbot, that asks the user one question per time and waits the user to answer each question to be able to ask him the next one, validate user's answer against the question topic if its not related ask the user to re answer before asking the next question,\
            these are the questions delimited by <txt></txt> each question is followed by the validation for each answer to be able to view the  next question without printing the validation message, ask only one question per time:  \
           <txt> 1- What are you building?\ 
            user can only choose from the following [WEBSITE, SERVICE, MOBILEAPP] \
            2- What is the purpose/goal of what you’re building? What are you looking to solve? \
            user's answer should only be related to the purpose/goal of the type he choose from the previous questions
            3- Any key features or project requirements that you would like to share? \
            user should only enter key feature and requirements related to his project </txt>
            then after getting user's answers, from these answers return only the features names found in this feature list that maps to the user needs: \
            features: ${features}
            first thing now you should start with the first question`,
        },
    ];
    await openai
        .createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: context,
        })
        .then((res) => {
            console.log(res.data.choices[0].message.content);
            context.push({
                role: "assistant",
                content: res.data.choices[0].message.content,
            });
        });
    userInterface.on("line", async (input) => {
        if (input.length != 0)
            context.push({
                role: "user",
                content: input,
            });
        await openai
            .createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: context,
            })
            .then((res) => {
                console.log(res.data.choices[0].message.content);
                context.push({
                    role: "assistant",
                    content: res.data.choices[0].message.content,
                });
                userInterface.prompt();
            })
            .catch((e) => {
                console.log(e);
            });
    });
});

app.post("/validate_questions", async (req, res) => {
    const question = req.body.question;
    const answer = req.body.answer;

    const prompt = `
        given the following question: ${question} and the following user's answer: ${answer} regarding user's product please validate that the answer is within the question answer, return 'your answer is offtopic if not, please re-answer' if not
    `;
    await openai
        .createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        })
        .then((res) => {
            console.log(res.data.choices[0].message.content);
        });
});

app.listen(3000, () => console.log("Example app is listening on port 3000."));
